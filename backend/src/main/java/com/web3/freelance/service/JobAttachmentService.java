package com.web3.freelance.service;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.exception.ValidationException;
import com.web3.freelance.model.Job;
import com.web3.freelance.model.JobAttachment;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.JobAttachmentRepository;
import com.web3.freelance.repository.JobRepository;
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
public class JobAttachmentService {

    private static final long MAX_FILE_SIZE_BYTES = 100L * 1024 * 1024;
    private static final int MAX_FILE_NAME_LENGTH = 255;

    private final JobRepository jobRepository;
    private final JobAttachmentRepository jobAttachmentRepository;
    private final UserService userService;

    @Value("${app.uploads.job-attachments-dir:uploads/job-attachments}")
    private String attachmentStorageDirectory;

    @Transactional
    public List<JobAttachment> uploadAttachments(Long jobId, Long userId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw ValidationException.missingField("files");
        }

        return files.stream()
                .map(file -> uploadAttachment(jobId, userId, file))
                .toList();
    }

    @Transactional
    public JobAttachment uploadAttachment(Long jobId, Long userId, MultipartFile file) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.JOB_NOT_FOUND, "Job not found"));
        User uploader = userService.getUserById(userId);

        if (!job.getClient().getId().equals(userId)) {
            throw new AccessDeniedException("Only the job owner can attach files to this job");
        }

        validateFile(file);

        String safeFileName = sanitizeFileName(file.getOriginalFilename());
        String storageKey = Path.of(String.valueOf(jobId), UUID.randomUUID() + "-" + safeFileName)
                .toString();
        Path targetPath = getStorageRoot().resolve(storageKey).normalize();
        ensurePathWithinStorageRoot(targetPath);

        String sha256Hash = writeFile(file, targetPath);

        JobAttachment attachment = JobAttachment.builder()
                .job(job)
                .storageProvider(JobAttachment.StorageProvider.LOCAL)
                .storageKey(storageKey)
                .fileName(safeFileName)
                .contentType(truncate(file.getContentType(), 120))
                .fileSizeBytes(file.getSize())
                .uploadedByUser(uploader)
                .sha256Hash(sha256Hash)
                .createdAt(LocalDateTime.now())
                .build();

        JobAttachment savedAttachment = jobAttachmentRepository.save(attachment);
        savedAttachment.setPublicUrl("/api/jobs/%d/attachments/%d/download".formatted(jobId, savedAttachment.getId()));

        return savedAttachment;
    }

    @Transactional(readOnly = true)
    public AttachmentDownload loadAttachment(Long jobId, Long attachmentId) {
        JobAttachment attachment = jobAttachmentRepository.findByIdAndJobId(attachmentId, jobId)
                .orElseThrow(() -> ResourceNotFoundException.forResource("Job attachment", attachmentId));
        Path filePath = getStorageRoot().resolve(attachment.getStorageKey()).normalize();
        ensurePathWithinStorageRoot(filePath);

        try {
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw ResourceNotFoundException.forResource("Job attachment file", attachmentId);
            }

            return new AttachmentDownload(attachment, resource);
        } catch (MalformedURLException exception) {
            throw ValidationException.invalidInput("Attachment path is invalid");
        }
    }

    @Transactional
    public void deleteAttachment(Long jobId, Long attachmentId, Long userId) {
        JobAttachment attachment = jobAttachmentRepository.findByIdAndJobId(attachmentId, jobId)
                .orElseThrow(() -> ResourceNotFoundException.forResource("Job attachment", attachmentId));

        if (!attachment.getJob().getClient().getId().equals(userId)) {
            throw new AccessDeniedException("Only the job owner can remove attachments from this job");
        }

        Path filePath = getStorageRoot().resolve(attachment.getStorageKey()).normalize();
        ensurePathWithinStorageRoot(filePath);
        jobAttachmentRepository.delete(attachment);

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

    public record AttachmentDownload(JobAttachment attachment, Resource resource) {}
}
