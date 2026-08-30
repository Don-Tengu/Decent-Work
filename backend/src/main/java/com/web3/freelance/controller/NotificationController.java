package com.web3.freelance.controller;

import com.web3.freelance.model.Notification;
import com.web3.freelance.model.User;
import com.web3.freelance.service.NotificationService;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Notification> myNotifications(@Argument Integer limit, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return notificationService.getMyNotifications(currentUser.getId(), limit);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public int unreadNotificationCount(Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return (int) Math.min(notificationService.getUnreadCount(currentUser.getId()), Integer.MAX_VALUE);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Notification markNotificationRead(@Argument Long id, Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return notificationService.markRead(id, currentUser.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Boolean markAllNotificationsRead(Authentication authentication) {
        User currentUser = userService.getUserByEmail(authentication.getName());
        return notificationService.markAllRead(currentUser.getId());
    }
}
