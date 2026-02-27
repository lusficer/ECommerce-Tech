package com.Lusficer.ProductService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PRODUCT")
@Data
public class Product {
    @Id
    private String productId;

    @Column(nullable = false)
    private String shopId;

    @Column(nullable = false)
    private String categoryId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus; // DRAFT, PENDING, APPROVED, REJECTED

    private Boolean isDeleted = false; // Soft delete 


    private LocalDateTime submittedAt; // Thời gian gửi duyệt [cite: 16]

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}