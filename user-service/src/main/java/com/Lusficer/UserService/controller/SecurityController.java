package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.dto.request.SecurityUpdateRequest;
import com.Lusficer.UserService.dto.response.SecurityUpdateResponse;
import com.Lusficer.UserService.service.SecurityService;
import com.Lusficer.UserService.config.JwtTokenProvider;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
@Tag(name = "Security", description = "Manage account security settings")
public class SecurityController {

    private final SecurityService securityService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Updates account security settings for the authenticated user.
     */
    @PutMapping("/security")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SecurityUpdateResponse> updateSecurity(
            @RequestBody @Valid SecurityUpdateRequest request,
            Authentication auth) {

        String userId = jwtTokenProvider.getUserIdFromAuth(auth);
        SecurityUpdateResponse response = securityService.updateSecurity(userId, request);
        return ResponseEntity.ok(response);
    }
}