package com.web3.freelance.service;

import com.web3.freelance.exception.ResourceNotFoundException;
import com.web3.freelance.model.User;
import com.web3.freelance.model.UserProfile;
import com.web3.freelance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
        }

        if (request.fullName() != null) {
            profile.setFullName(request.fullName());
        }
        if (request.bio() != null) {
            profile.setBio(request.bio());
        }
        if (request.skills() != null) {
            profile.setSkills(request.skills());
        }
        if (request.hourlyRate() != null) {
            profile.setHourlyRate(request.hourlyRate());
        }
        if (request.profileImage() != null) {
            profile.setProfileImage(request.profileImage());
        }

        user.setProfile(profile);
        return userRepository.save(user);
    }

    @Transactional
    public User connectWallet(Long userId, String walletAddress) {
        User user = getUserById(userId);
        user.setWalletAddress(walletAddress);
        return userRepository.save(user);
    }

    public record UpdateProfileRequest(
            String fullName,
            String bio,
            java.util.List<String> skills,
            BigDecimal hourlyRate,
            String profileImage
    ) {}
}
