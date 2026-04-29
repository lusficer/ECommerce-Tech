package com.Lusficer.OrderService.service;

import com.Lusficer.OrderService.client.NotificationClient;
import com.Lusficer.OrderService.dto.request.CreateNotificationRequest;
import com.Lusficer.OrderService.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationHelper {

    private final NotificationClient notificationClient;

    /**
     * Send notification asynchronously
     * Wrapped in try-catch to prevent notification failures from affecting order processing
     */
    @Async
    public void sendNotification(CreateNotificationRequest request) {
        try {
            notificationClient.createNotification(request);
            log.info("Notification sent successfully - Type: {}, Target: {}", 
                    request.getType(), 
                    request.getUserId() != null ? request.getUserId() : request.getTargetRole());
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            // Don't rethrow - notification failure should not affect main flow
        }
    }

    /**
     * Send ORDER_STATUS_CHANGED notification to customer
     */
    public void notifyOrderStatusChanged(String orderId, String userId, String newStatus) {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .userId(userId)
            .type(NotificationType.ORDER_STATUS_CHANGED)
            .title("Order Status Updated")
            .message(String.format("Your order #%s has been updated to %s", orderId, newStatus))
                .referenceId(orderId)
                .referenceType("ORDER")
                .build();
        
        sendNotification(request);
    }

    /**
     * Send ORDER_PENDING_VERIFICATION notification to managers
     */
    public void notifyOrderPendingVerification(String orderId, String shopId, BigDecimal grandTotal) {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .targetRole("MANAGER")
                .shopId(shopId)
                .type(NotificationType.ORDER_PENDING_VERIFICATION)
                .title("Order Needs Verification")
                .message(String.format("Order #%s (%s) requires verification", orderId, grandTotal))
                .referenceId(orderId)
                .referenceType("ORDER")
                .build();
        
        sendNotification(request);
    }

    /**
     * Send NEW_ORDER_RECEIVED notification to vendors
     */
    public void notifyNewOrderReceived(String orderId, String shopId) {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .targetRole("VENDOR")
                .shopId(shopId)
            .type(NotificationType.NEW_ORDER_RECEIVED)
                .title("New Order Received")
                .message(String.format("You have a new order #%s that needs processing", orderId))
                .referenceId(orderId)
                .referenceType("ORDER")
                .build();
        
        sendNotification(request);
    }

    /**
     * Send ORDER_AVAILABLE_FOR_PICKUP notification to shippers
     */
    public void notifyOrderAvailableForShipping(String orderId) {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .targetRole("SHIPPER")
            .type(NotificationType.ORDER_AVAILABLE_FOR_PICKUP)
                .title("Order Ready for Pickup")
                .message(String.format("New order #%s is ready for delivery", orderId))
                .referenceId(orderId)
                .referenceType("ORDER")
                .build();
        
        sendNotification(request);
    }

    /**
     * Send ORDER_VERIFIED notification to customer
     */
    public void notifyOrderVerified(String orderId, String userId) {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .userId(userId)
            .type(NotificationType.ORDER_VERIFIED)
                .title("Order Verified")
                .message(String.format("Your order #%s has been verified and will be processed", orderId))
                .referenceId(orderId)
                .referenceType("ORDER")
                .build();
        
        sendNotification(request);
    }

    /**
     * Send ORDER_REJECTED notification to customer
     */
    public void notifyOrderRejected(String orderId, String userId, String reason) {
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .userId(userId)
            .type(NotificationType.ORDER_REJECTED)
                .title("Order Rejected")
                .message(String.format("Your order #%s has been rejected: %s", orderId, reason))
                .referenceId(orderId)
                .referenceType("ORDER")
                .build();
        
        sendNotification(request);
    }
}
