package com.Lusficer.DisputeService.entity;
public enum DisputeStatus {
    PENDING,            // Vừa tạo
    UNDER_REVIEW,       // Manager đang xem
    WAITING_FOR_INFO,   // Manager yêu cầu thêm thông tin
    RESOLVED_APPROVED,  // Chấp nhận khiếu nại
    RESOLVED_REJECTED   // Từ chối khiếu nại
}