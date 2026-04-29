package com.Lusficer.InventoryService.enums;

public enum NotificationType {
    // Customer notifications
    ORDER_STATUS_CHANGED,
    ORDER_VERIFIED,
    ORDER_REJECTED,
    DISPUTE_RESOLVED,
    DISPUTE_NEEDS_INFO,

    // Vendor notifications
    NEW_ORDER_RECEIVED,
    PRODUCT_APPROVED,
    PRODUCT_REJECTED,
    LOW_STOCK_WARNING,

    // Manager notifications
    ORDER_PENDING_VERIFICATION,
    NEW_DISPUTE_CREATED,

    // Shipper notifications
    ORDER_AVAILABLE_FOR_PICKUP
}
