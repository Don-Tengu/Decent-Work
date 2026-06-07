package com.web3.freelance.controller;

import com.web3.freelance.model.BidAttachment;
import com.web3.freelance.model.User;
import com.web3.freelance.service.BidAttachmentService;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/bids/{bidId}/attachments")
@RequiredArgsConstructor
public class BidAttachmentController {

    private final BidAttachmentService bidAttachmentService;
    private final UserService userService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public List<BidAttachmentResponse> uploadAttachments(
            @PathVariable Long bidId,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByEmail(authentication.getName());

        return bidAttachmentService.uploadAttachments(bidId, currentUser.getId(), Arrays.asList(files)).stream()
                .map(BidAttachmentResponse::from)
                .toList();
    }

    @GetMapping("/{attachmentId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long bidId,
            @PathVariable Long attachmentId,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        BidAttachmentService.AttachmentDownload download =
                bidAttachmentService.loadAttachment(bidId, attachmentId, currentUser.getId());
        BidAttachment attachment = download.attachment();
        MediaType mediaType = attachment.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(attachment.getContentType());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(attachment.getFileSizeBytes())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(attachment.getFileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(download.resource());
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long bidId,
            @PathVariable Long attachmentId,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        bidAttachmentService.deleteAttachment(bidId, attachmentId, currentUser.getId());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    public record BidAttachmentResponse(
            Long id,
            BidAttachment.StorageProvider storageProvider,
            String storageKey,
            String fileName,
            String contentType,
            Long fileSizeBytes,
            String publicUrl,
            String sha256Hash,
            LocalDateTime createdAt
    ) {
        public static BidAttachmentResponse from(BidAttachment attachment) {
            return new BidAttachmentResponse(
                    attachment.getId(),
                    attachment.getStorageProvider(),
                    attachment.getStorageKey(),
                    attachment.getFileName(),
                    attachment.getContentType(),
                    attachment.getFileSizeBytes(),
                    attachment.getPublicUrl(),
                    attachment.getSha256Hash(),
                    attachment.getCreatedAt()
            );
        }
    }
}
