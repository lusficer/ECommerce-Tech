package com.Lusficer.OrderService.enums;

public enum OrderStatus {
    PENDING_VERIFICATION, // Chờ Manager duyệt
    NEW,                  // Mới (Vendor thấy)
    PROCESSING,           // Đang đóng gói
    SHIPPING,             // Đang giao
    DELIVERED, 
    DELIVERY_FAILED,          
    COMPLETED,            // Hoàn tất
    CANCELLED,            // Đã hủy
    REJECTED,             // Bị từ chối duyệt
    RETURNED              // Hoàn trả
}
