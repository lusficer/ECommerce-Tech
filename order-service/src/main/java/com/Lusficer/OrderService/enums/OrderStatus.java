package com.Lusficer.OrderService.enums;

public enum OrderStatus {
    PENDING_VERIFICATION, // Awaiting manager verification
    NEW,                  // Newly created (visible to vendor)
    PROCESSING,           // Being packed
    SHIPPING,             // In delivery
    DELIVERED,            // Delivered to customer
    DELIVERY_FAILED,      // Delivery failed
    COMPLETED,            // Completed by customer
    CANCELLED,            // Cancelled
    REJECTED,             // Verification rejected
    RETURNED              // Returned
}
