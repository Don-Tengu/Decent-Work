package com.web3.freelance.service;

import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.exception.ValidationException;
import com.web3.freelance.model.Bid;
import com.web3.freelance.model.BidAttachment;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.BidAttachmentRepository;
import com.web3.freelance.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BidAttachmentService {

    private static final long MAX_FILE_SIZE_BYTES = 100L * 1024 * 1024;
    private static final int MAX_FILE_NAME_LENGTH = 255;

    private final BidRepository bidRepository;
    private final BidAttachmentRepository bidAttachmentRepository;
    private final UserService userService;

    @Value("${app.uploads.bid-attachments-dir:uploads/bid-attachments}")
    private String attachmentStorageDirectory;

    @Transactional
    public List<BidAttachment> uploadAttachments(Long bidId, Long userId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw ValidationException.missingField("files");
        }

        return files.stream()
                .map(file -> uploadAttachment(bidId, userId, file))
                .toList();
    }

    @Transactional
    public BidAttachment uploadAttachment(Long bidId, Long userId, MultipartFile file) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> ResourceNotFoundException.forResource("Bid", bidId));
        User uploader = userService.getUserById(userId);

        if (!bid.getFreelancer().getId().equals(userId)) {
            throw new AccessDeniedException("Only the proposal owner can attach files to this proposal");
        }

        validateFile(file);

        String safeFileName = sanitizeFileName(file.getOriginalFilename());
        String storageKey = Path.of(String.valueOf(bidId), UUID.randomUUID() + "-" + safeFileName)
                .toString();
        Path targetPath = getStorageRoot().resolve(storageKey).normalize();
        ensurePathWithinStorageRoot(targetPath);

        String sha256Hash = writeFile(file, targetPath);

        BidAttachment attachment = BidAttachment.builder()
                .bid(bid)
                .storageProvider(BidAttachment.StorageProvider.LOCAL)
                .storageKey(storageKey)
                .fileName(safeFileName)
                .contentType(truncate(file.getContentType(), 120))
                .fileSizeBytes(file.getSize())
                .uploadedByUser(uploader)
                .sha256Hash(sha256Hash)
                .createdAt(LocalDateTime.now())
                .build();

        BidAttachment savedAttachment = bidAttachmentRepository.save(attachment);
        savedAttachment.setPublicUrl("/api/bids/%d/attachments/%d/download".formatted(bidId, savedAttachment.getId()));

        return savedAttachment;
    }

    @Transactional(readOnly = true)
    public AttachmentDownload loadAttachment(Long bidId, Long attachmentId, Long userId) {
        BidAttachment attachment = bidAttachmentRepository.findByIdAndBidId(attachmentId, bidId)
                .orElseThrow(() -> ResourceNotFoundException.forResource("Bid attachment", attachmentId));

        Bid bid = attachment.getBid();
        boolean isProposalOwner = bid.getFreelancer().getId().equals(userId);
        boolean isHiringClient = bid.getJob().getClient().getId().equals(userId);

        if (!isProposalOwner && !isHiringClient) {
            throw new AccessDeniedException("You do not have access to this proposal attachment");
        }

        Path filePath = getStorageRoot().resolve(attachment.getStorageKey()).normalize();
        ensurePathWithinStorageRoot(filePath);

        try {
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw ResourceNotFoundException.forResource("Bid attachment file", attachmentId);
            }

            return new AttachmentDownload(attachment, resource);
        } catch (MalformedURLException exception) {
            throw ValidationException.invalidInput("Attachment path is invalid");
        }
    }

    @Transactional
    public void deleteAttachment(Long bidId, Long attachmentId, Long userId) {
        BidAttachment attachment = bidAttachmentRepository.findByIdAndBidId(attachmentId, bidId)
                .orElseThrow(() -> ResourceNotFoundException.forResource("Bid attachment", attachmentId));

        if (!attachment.getBid().getFreelancer().getId().equals(userId)) {
            throw new AccessDeniedException("Only the proposal owner can remove attachments from this proposal");
        }

        Path filePath = getStorageRoot().resolve(attachment.getStorageKey()).normalize();
        ensurePathWithinStorageRoot(filePath);
        bidAttachmentRepository.delete(attachment);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException exception) {
            throw ValidationException.invalidInput("Unable to delete the attachment");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ValidationException.missingField("file");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw ValidationException.invalidInput("Attachment files must be 100MB or smaller");
        }
    }

    private String writeFile(MultipartFile file, Path targetPath) {
        try {
            Files.createDirectories(targetPath.getParent());
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            try (InputStream inputStream = new DigestInputStream(file.getInputStream(), digest)) {
                Files.copy(inputStream, targetPath);
            }

            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException exception) {
            throw ValidationException.invalidInput("Unable to store the attachment");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private Path getStorageRoot() {
        return Path.of(attachmentStorageDirectory).toAbsolutePath().normalize();
    }

    private void ensurePathWithinStorageRoot(Path path) {
        if (!path.startsWith(getStorageRoot())) {
            throw ValidationException.invalidInput("Attachment path is invalid");
        }
    }

    private String sanitizeFileName(String fileName) {
        String normalizedFileName = fileName == null ? "attachment" : Path.of(fileName).getFileName().toString();
        String safeFileName = normalizedFileName
                .replaceAll("[\\r\\n]", "")
                .replaceAll("[^A-Za-z0-9._ -]", "_")
                .trim();

        if (safeFileName.isBlank()) {
            safeFileName = "attachment";
        }

        return truncate(safeFileName, MAX_FILE_NAME_LENGTH);
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength);
    }

    public record AttachmentDownload(BidAttachment attachment, Resource resource) {}
}
