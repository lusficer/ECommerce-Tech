package com.Lusficer.UserService.service;

import com.Lusficer.UserService.dto.request.SecurityUpdateRequest;
import com.Lusficer.UserService.dto.response.SecurityUpdateResponse;
import com.Lusficer.UserService.entity.UserAuth;
import com.Lusficer.UserService.exception.BadRequestException;
import com.Lusficer.UserService.exception.ResourceNotFoundException;
import com.Lusficer.UserService.repository.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SecurityService {

    /**
     * Handles security-related account updates.
     */

    private final UserAuthRepository userAuthRepo;
    private final PasswordEncoder passwordEncoder;

    /**
     * Updates the user's password after validating the current password.
     */
    @Transactional
    public SecurityUpdateResponse updateSecurity(String userId, SecurityUpdateRequest req) {
        UserAuth auth = userAuthRepo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!passwordEncoder.matches(req.currentPassword(), auth.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        auth.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userAuthRepo.save(auth);

    return SecurityUpdateResponse.builder()
        .message("Password updated successfully")
        .build();
    }
}