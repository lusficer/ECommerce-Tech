package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.dto.response.NotificationDTO;
import com.Lusficer.UserService.dto.response.UnreadCountDTO;
import com.Lusficer.UserService.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notification management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all unread notifications for the authenticated user
     * Frontend polls this endpoint every 15 seconds
     */
    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Returns list of unread notifications for the current user")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        String userId = getCurrentUserId();
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count
     * Primary poll endpoint for frontend (lightweight)
     */
    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Returns count of unread notifications with breakdown by type")
    public ResponseEntity<UnreadCountDTO> getUnreadCount() {
        String userId = getCurrentUserId();
        UnreadCountDTO count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    /**
     * Get all notifications with pagination
     */
    @GetMapping
    @Operation(summary = "Get all notifications", description = "Returns paginated list of all notifications")
    public ResponseEntity<Page<NotificationDTO>> getAllNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationDTO> notifications = notificationService.getAllNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Mark a specific notification as read
     */
    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark as read", description = "Mark a specific notification as read")
    public ResponseEntity<String> markAsRead(@PathVariable("notificationId") Long notificationId) {
        String userId = getCurrentUserId();
        boolean success = notificationService.markAsRead(notificationId, userId);
        
        if (success) {
            return ResponseEntity.ok("Marked as read");
        } else {
            return ResponseEntity.badRequest().body("Notification not found or access denied");
        }
    }

    /**
     * Mark all notifications as read
     */
    @PutMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Mark all unread notifications as read for the current user")
    public ResponseEntity<String> markAllAsRead() {
        String userId = getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok("All marked as read");
    }

    /**
     * Get current authenticated user ID from SecurityContext
     */
    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
