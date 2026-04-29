package com.Lusficer.UserService.service;

import com.Lusficer.UserService.dto.admin.AdminUserListDTO;
import com.Lusficer.UserService.entity.UserStatus;
import com.Lusficer.UserService.repository.UserProfileRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import com.Lusficer.UserService.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserProfileRepository userProfileRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserStatusRepository userStatusRepository;

    public Page<AdminUserListDTO> listUsers(String role, Boolean isBanned, String search, Pageable pageable) {
        String normalizedRole = (role == null || role.isBlank()) ? null : role.trim();
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        return userProfileRepository
                .searchUsersForAdmin(normalizedRole, isBanned, normalizedSearch, pageable)
                .map(profile -> {
                    String userId = profile.getUserId();
                    String roleName = userRoleRepository.findByUserId(userId)
                            .map(userRole -> userRole.getRoleName().name())
                            .orElse(null);
                    UserStatus status = userStatusRepository.findById(userId).orElse(null);

                    return AdminUserListDTO.builder()
                            .userId(userId)
                            .name(profile.getName())
                            .email(profile.getEmail())
                            .phone(profile.getPhone())
                            .role(roleName)
                            .isBanned(status != null && Boolean.TRUE.equals(status.getIsBanned()))
                            .isVerified(status != null && Boolean.TRUE.equals(status.getIsVerified()))
                            .banReason(status != null ? status.getBanReason() : null)
                            .createdAt(profile.getCreatedAt())
                            .build();
                });
    }

    @Transactional
    public void setBanStatus(String userId, boolean banned, String reason) {
        if (banned && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("Ban reason is required when banned=true");
        }
        if (!userProfileRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        UserStatus status = userStatusRepository.findById(userId)
                .orElse(UserStatus.builder()
                        .userId(userId)
                        .isOnline(false)
                        .isVerified(false)
                        .isBanned(false)
                        .build());

        status.setIsBanned(banned);
        status.setBanReason(banned ? reason.trim() : null);
        userStatusRepository.save(status);
    }
}
