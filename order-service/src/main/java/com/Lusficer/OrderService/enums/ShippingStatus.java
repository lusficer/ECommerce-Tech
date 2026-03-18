package com.Lusficer.OrderService.enums;

public enum ShippingStatus {
    PICKING_UP, // Shipper đang trên đường đến Shop lấy hàng
    IN_TRANSIT, // Shipper đã lấy hàng và đang đi giao cho khách
    DELIVERED,  // Giao hàng thành công
    FAILED,     // Giao thất bại (gọi không nghe máy, khách từ chối nhận...)
    RETURNED    // Đã hoàn trả lại hàng về cho Shop
}