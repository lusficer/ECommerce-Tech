package com.Lusficer.FulfillmentService.entity;

public enum ShipmentStatus {
    NEW,                    // Đơn mới
    PICKING,                // Vendor đang nhặt hàng
    PACKED,                 // Đã đóng gói & In tem
    HANDED_OVER,            // Đã bàn giao vận chuyển
    RECEIVED_AT_WAREHOUSE,  // Kho đã nhận
    VERIFIED,               // Kho đã kiểm tra OK
    ISSUE_REPORTED,         // Có lỗi kiểm hàng
    DISPATCHED              // Đã xuất kho (Hoàn tất)
}