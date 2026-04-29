package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.dto.ShipperInfoDTO;
import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.repository.UserAuthRepository;
import com.Lusficer.UserService.repository.UserProfileRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
@Tag(name = "Internal User", description = "Internal service-to-service user APIs")
public class InternalUserController {

    private final UserAuthRepository userAuthRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRoleRepository userRoleRepository;

    @GetMapping("/{userId}/created-at")
    @Operation(summary = "Get user account createdAt by userId")
    public ResponseEntity<LocalDateTime> getUserCreatedAt(
            @PathVariable("userId") String userId) {
        return userAuthRepository.findByUserId(userId)
                .map(auth -> ResponseEntity.ok(auth.getCreatedAt()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/shippers")
    @Operation(summary = "Get all users with SHIPPER role")
    public ResponseEntity<List<ShipperInfoDTO>> getAllShippers() {
        List<UserRole> shipperRoles = userRoleRepository
                .findByRoleName(UserRole.RoleName.SHIPPER);

        List<ShipperInfoDTO> shippers = new ArrayList<>();
        for (UserRole role : shipperRoles) {
            userProfileRepository.findById(role.getUserId()).ifPresent(profile -> {
                ShipperInfoDTO dto = ShipperInfoDTO.builder()
                        .shipperId(role.getUserId())
                        .fullName(profile.getName())
                        .phone(profile.getPhone())
                        .build();
                shippers.add(dto);
            });
        }

        return ResponseEntity.ok(shippers);
    }
}