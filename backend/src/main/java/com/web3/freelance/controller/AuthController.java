package com.web3.freelance.controller;

import com.web3.freelance.model.User;
import com.web3.freelance.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @MutationMapping
    public Map<String, Object> register(@Argument Map<String, Object> input) {
        AuthService.RegisterRequest request = new AuthService.RegisterRequest(
                (String) input.get("email"),
                (String) input.get("username"),
                (String) input.get("password"),
                User.UserRole.valueOf((String) input.get("role")),
                (String) input.get("walletAddress")
        );

        AuthService.AuthResponse response = authService.register(request);

        return Map.of(
                "token", response.token(),
                "user", response.user()
        );
    }

    @MutationMapping
    public Map<String, Object> login(@Argument String email, @Argument String password) {
        AuthService.AuthResponse response = authService.login(email, password);

        return Map.of(
                "token", response.token(),
                "user", response.user()
        );
    }
}
