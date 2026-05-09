package com.web3.freelance.controller;

import com.web3.freelance.model.User;
import com.web3.freelance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public User me(Authentication authentication) {
        String email = authentication.getName();
        return userService.getUserByEmail(email);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public User user(@Argument Long id) {
        return userService.getUserById(id);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public User updateProfile(@Argument Map<String, Object> input, Authentication authentication) {
        String email = authentication.getName();
        User currentUser = userService.getUserByEmail(email);

        UserService.UpdateProfileRequest request = new UserService.UpdateProfileRequest(
                (String) input.get("fullName"),
                (String) input.get("bio"),
                (java.util.List<String>) input.get("skills"),
                input.get("hourlyRate") != null ? new BigDecimal(input.get("hourlyRate").toString()) : null,
                (String) input.get("profileImage")
        );

        return userService.updateProfile(currentUser.getId(), request);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public User connectWallet(@Argument String walletAddress, Authentication authentication) {
        String email = authentication.getName();
        User currentUser = userService.getUserByEmail(email);

        return userService.connectWallet(currentUser.getId(), walletAddress);
    }
}
