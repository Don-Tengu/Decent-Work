package com.web3.freelance.service;

import com.web3.freelance.exception.DuplicateResourceException;
import com.web3.freelance.exception.UnauthorizedException;
import com.web3.freelance.model.User;
import com.web3.freelance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw DuplicateResourceException.emailExists(request.email());
        }
        if (userRepository.existsByUsername(request.username())) {
            throw DuplicateResourceException.usernameExists(request.username());
        }

        User user = User.builder()
                .email(request.email())
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .role(request.role())
                .walletAddress(request.walletAddress())
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user);
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(UnauthorizedException::invalidCredentials);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw UnauthorizedException.invalidCredentials();
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user);
    }

    public record RegisterRequest(
            String email,
            String username,
            String password,
            User.UserRole role,
            String walletAddress
    ) {}

    public record AuthResponse(String token, User user) {}
}
