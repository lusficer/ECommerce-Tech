package com.Lusficer.DisputeService.entity;

public enum DisputeReason {
    PAYMENT_ISSUE,      // Vấn đề về thanh toán (trừ sai tiền, chưa nhận được tiền)
    RETURN_REFUND,      // Yêu cầu trả hàng/hoàn tiền
    DAMAGED_GOODS,      // Hàng hóa bị hư hỏng, bể vỡ
    ITEM_NOT_RECEIVED,  // Khách chưa nhận được hàng
    WRONG_ITEM,         // Giao sai sản phẩm
    OTHER               // Lý do khác
}