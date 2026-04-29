package com.Lusficer.UserService.enums;

public enum NotificationType {
    // Customer notifications
    ORDER_STATUS_CHANGED,       // Order status changed
    ORDER_VERIFIED,             // Order has been verified
    ORDER_REJECTED,             // Order has been rejected
    DISPUTE_RESOLVED,           // Dispute has been resolved
    DISPUTE_NEEDS_INFO,         // Dispute needs additional information

    // Vendor notifications
    NEW_ORDER_RECEIVED,         // New order received that needs processing
    PRODUCT_APPROVED,           // Product has been approved
    PRODUCT_REJECTED,           // Product has been rejected
    LOW_STOCK_WARNING,          // Product stock is running low

    // Manager notifications
    ORDER_PENDING_VERIFICATION, // Large order needs verification
    NEW_DISPUTE_CREATED,        // New dispute created that needs handling

    // Shipper notifications
    ORDER_AVAILABLE_FOR_PICKUP  // New order available for delivery
}
