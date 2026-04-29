package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.dto.request.CreateNotificationRequest;
import com.Lusficer.UserService.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internal/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Internal Notifications", description = "Internal API for service-to-service notification creation")
public class NotificationInternalController {

    private final NotificationService notificationService;

    /**
     * Create a single notification
     * Called by other microservices to send notifications to users
     */
    @PostMapping
    @Operation(summary = "Create notification", description = "Create a notification for user(s) - called by other services")
    public ResponseEntity<String> createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        try {
            notificationService.createNotification(request);
            log.info("Notification created - Type: {}, Target: {}", 
                    request.getType(), 
                    request.getUserId() != null ? request.getUserId() : request.getTargetRole());
            return ResponseEntity.ok("Notification created");
        } catch (Exception e) {
            log.error("Failed to create notification: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to create notification: " + e.getMessage());
        }
    }

    /**
     * Create multiple notifications in batch
     * Useful when multiple events trigger notifications simultaneously
     */
    @PostMapping("/batch")
    @Operation(summary = "Create notifications batch", description = "Create multiple notifications at once")
    public ResponseEntity<String> createNotificationBatch(@Valid @RequestBody List<CreateNotificationRequest> requests) {
        try {
            notificationService.createNotificationBatch(requests);
            log.info("Batch notification created - Count: {}", requests.size());
            return ResponseEntity.ok("Notifications created");
        } catch (Exception e) {
            log.error("Failed to create batch notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to create notifications: " + e.getMessage());
        }
    }
}
