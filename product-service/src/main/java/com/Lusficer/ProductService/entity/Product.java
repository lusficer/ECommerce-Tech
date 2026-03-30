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

    @Column(name = "brand")
    private String brand;

    @Lob
    @Column(name = "specifications", columnDefinition = "LONGTEXT")
    private String specifications;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "discountPercentage")
    private Integer discountPercentage = 0;

    @Column(name = "soldCount") 
    private Integer soldCount = 0;

    @Lob
    @Column(name = "imageUrl", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus; // DRAFT, PENDING, APPROVED, REJECTED

    private Boolean isDeleted = false; // Soft delete 

    // Rating aggregates
    @Column(name = "averageRating", columnDefinition = "DECIMAL(3,2) DEFAULT 0.00")
    private Double averageRating = 0.0;

    @Column(name = "totalReviews", columnDefinition = "INT DEFAULT 0")
    private Integer totalReviews = 0;

    private LocalDateTime submittedAt; 

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient 
    private Integer stockQuantity = 0;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}