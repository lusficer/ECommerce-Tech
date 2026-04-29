package com.Lusficer.UserService.service;

import com.Lusficer.UserService.client.ShopClient;
import com.Lusficer.UserService.dto.request.CreateNotificationRequest;
import com.Lusficer.UserService.dto.response.NotificationDTO;
import com.Lusficer.UserService.dto.response.UnreadCountDTO;
import com.Lusficer.UserService.entity.Notification;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.enums.NotificationType;
import com.Lusficer.UserService.repository.NotificationRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRoleRepository userRoleRepository;
    private final ShopClient shopClient;

    /**
     * Create notification(s) based on request
     * Routes to specific user(s) based on userId or targetRole
     */
    @Transactional
    public void createNotification(CreateNotificationRequest request) {
        Set<String> targetUserIds = new HashSet<>();

        // Route to specific user if userId provided
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            targetUserIds.add(request.getUserId());
        }
        // Route by role if targetRole provided
        else if (request.getTargetRole() != null && !request.getTargetRole().isEmpty()) {
            targetUserIds.addAll(getUserIdsByRole(request.getTargetRole(), request.getShopId()));
        }

        // Create notification for each target user
        for (String userId : targetUserIds) {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .type(request.getType())
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .referenceId(request.getReferenceId())
                    .referenceType(request.getReferenceType())
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            log.info("Created notification for user {} - Type: {}", userId, request.getType());
        }
    }

    /**
     * Create multiple notifications in batch
     */
    @Transactional
    public void createNotificationBatch(List<CreateNotificationRequest> requests) {
        for (CreateNotificationRequest request : requests) {
            try {
                createNotification(request);
            } catch (Exception e) {
                log.error("Failed to create notification: {}", e.getMessage(), e);
                // Continue with next notification even if one fails
            }
        }
    }

    /**
     * Get user IDs by role and optional shopId
     */
    private Set<String> getUserIdsByRole(String targetRole, String shopId) {
        Set<String> userIds = new HashSet<>();

        try {
            switch (targetRole.toUpperCase()) {
                case "VENDOR":
                    if (shopId != null && !shopId.isEmpty()) {
                        // Get vendors for specific shop
                        List<String> vendorIds = shopClient.getShopVendors(shopId);
                        userIds.addAll(vendorIds);
                        
                        // Also add shop owner
                        String ownerId = shopClient.getShopOwner(shopId);
                        if (ownerId != null) {
                            userIds.add(ownerId);
                        }
                    }
                    break;

                case "MANAGER":
                    if (shopId != null && !shopId.isEmpty()) {
                        // Get shop owner (manager) for specific shop
                        String ownerId = shopClient.getShopOwner(shopId);
                        if (ownerId != null) {
                            userIds.add(ownerId);
                        }
                    } else {
                        // Get all shop managers
                        List<UserRole> managers = userRoleRepository.findByRoleName(UserRole.RoleName.SHOP_MANAGER);
                        userIds.addAll(managers.stream()
                                .map(UserRole::getUserId)
                                .collect(Collectors.toSet()));
                    }
                    break;

                case "SHIPPER":
                    // Get all shippers
                    List<UserRole> shippers = userRoleRepository.findByRoleName(UserRole.RoleName.SHIPPER);
                    userIds.addAll(shippers.stream()
                            .map(UserRole::getUserId)
                            .collect(Collectors.toSet()));
                    break;

                default:
                    log.warn("Unknown target role: {}", targetRole);
            }
        } catch (Exception e) {
            log.error("Error resolving users for role {}: {}", targetRole, e.getMessage(), e);
        }

        return userIds;
    }

    /**
     * Get all unread notifications for a user
     */
    public List<NotificationDTO> getUnreadNotifications(String userId) {
        List<Notification> notifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        return notifications.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get unread count with breakdown by type
     */
    public UnreadCountDTO getUnreadCount(String userId) {
        Long totalUnread = notificationRepository.countByUserIdAndIsReadFalse(userId);

        // Get count by type
        List<Object[]> countByTypeResults = notificationRepository.countByTypeForUser(userId);
        Map<String, Long> countByType = new HashMap<>();

        for (Object[] result : countByTypeResults) {
            NotificationType type = (NotificationType) result[0];
            Long count = (Long) result[1];
            countByType.put(type.name(), count);
        }

        return UnreadCountDTO.builder()
                .totalUnread(totalUnread)
                .countByType(countByType)
                .build();
    }

    /**
     * Get all notifications with pagination
     */
    public Page<NotificationDTO> getAllNotifications(String userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return notifications.map(this::toDTO);
    }

    /**
     * Mark a specific notification as read
     */
    @Transactional
    public boolean markAsRead(Long notificationId, String userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        return updated > 0;
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
        log.info("Marked all notifications as read for user: {}", userId);
    }

    /**
     * Convert entity to DTO
     */
    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .notificationId(notification.getNotificationId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
