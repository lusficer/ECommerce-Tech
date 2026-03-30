package com.Lusficer.OrderService.enums;

public enum ShippingStatus {
    PICKING_UP, // Shipper is on the way to pick up the order
    IN_TRANSIT, // Shipper is delivering the order to the customer
    DELIVERED,  // Delivery completed successfully
    FAILED,     // Delivery failed (no answer, customer refused, etc.)
    RETURNED    // Returned to the shop
}