// user-service/src/main/java/com/Lusficer/UserService/service/SecurityService.java
package com.Lusficer.UserService.service;

import com.Lusficer.UserService.dto.SecurityUpdateRequest;
import com.Lusficer.UserService.dto.SecurityUpdateResponse;
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
     * Class-level notes - Security algorithms
     *
     * - Password change flow:
     *   1. Load user by id.
     *   2. Verify `currentPassword` using `PasswordEncoder#matches` (BCrypt).
     *   3. If verification passes, encode the new password and set it on the user.
     *
     * - Two-Factor Authentication (2FA) flow:
     *   - When enabling 2FA: generate a secret via `TwoFactorService.generateSecret()`,
     *     persist it on the user and return a QR code URL derived from the secret.
     *   - When disabling 2FA: simply clear the flag/secret.
     *
     * - Transactional behavior is expected (method annotated `@Transactional`).
     *   Any failure should roll back the DB changes.
     *
     * - Errors are communicated via runtime exceptions (e.g. BadRequestException,
     *   ResourceNotFoundException) so controllers can map them to HTTP error codes.
     */

    private final UserAuthRepository userAuthRepo;
    private final PasswordEncoder passwordEncoder;

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