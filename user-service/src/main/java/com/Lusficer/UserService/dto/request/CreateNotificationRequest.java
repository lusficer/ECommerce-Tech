package com.Lusficer.UserService.dto.request;

import com.Lusficer.UserService.enums.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    
    /**
     * Specific user to receive notification (nullable if using targetRole)
     */
    private String userId;
    
    /**
     * Target role: "VENDOR" / "MANAGER" / "SHIPPER" (nullable if using userId)
     */
    private String targetRole;
    
    /**
     * Shop ID used with targetRole to find correct users (nullable)
     */
    private String shopId;
    
    /**
     * Notification type (required)
     */
    @NotNull(message = "Notification type is required")
    private NotificationType type;
    
    /**
     * Notification title (required)
     */
    @NotNull(message = "Title is required")
    private String title;
    
    /**
     * Notification message (required)
     */
    @NotNull(message = "Message is required")
    private String message;
    
    /**
     * Reference ID (orderId, productId, disputeId, etc.)
     */
    private String referenceId;
    
    /**
     * Reference type: "ORDER" / "PRODUCT" / "DISPUTE" / "INVENTORY"
     */
    private String referenceType;
}
