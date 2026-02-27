package com.Lusficer.ProductService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "PRODUCT_APPROVAL_LOG")
@Data
public class ProductApprovalLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    private String productId;

    private String actorId; // Shop Manager ID hoặc Vendor ID

    @Enumerated(EnumType.STRING)
    private ApprovalAction action; // SUBMIT, APPROVE, REJECT

    @Column(columnDefinition = "TEXT")
    private String comments; // Lý do từ chối 

    private LocalDateTime createdAt = LocalDateTime.now();
}
