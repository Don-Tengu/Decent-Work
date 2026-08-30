package com.web3.freelance.service;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.exception.UnauthorizedException;
import com.web3.freelance.model.Notification;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @Transactional
    public Notification create(
            User recipient,
            Notification.NotificationType type,
            String title,
            String message,
            String linkPath,
            Long jobId,
            Long bidId
    ) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .linkPath(linkPath)
                .read(false)
                .jobId(jobId)
                .bidId(bidId)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getMyNotifications(Long userId, Integer limit) {
        User user = userService.getUserById(userId);
        int pageSize = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(limit, 1), MAX_LIMIT);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user, PageRequest.of(0, pageSize));
    }

    public long getUnreadCount(Long userId) {
        User user = userService.getUserById(userId);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Transactional
    public Notification markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "Notification with ID " + notificationId + " not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new UnauthorizedException(
                    ErrorCode.INSUFFICIENT_PERMISSIONS,
                    "Only the recipient can mark this notification as read");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public boolean markAllRead(Long userId) {
        User user = userService.getUserById(userId);
        notificationRepository.markAllReadForRecipient(user);
        return true;
    }
}
