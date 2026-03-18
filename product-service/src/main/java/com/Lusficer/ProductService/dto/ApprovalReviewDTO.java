package com.Lusficer.ProductService.dto;

import lombok.Data;

@Data
public class ApprovalReviewDTO {
    private boolean approved; // true = APPROVE, false = REJECT
    private String comments; // Required when rejected
    private String managerId; // Approver's user ID
    private Integer discountPercentage;
}