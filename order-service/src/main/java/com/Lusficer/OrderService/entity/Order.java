package com.Lusficer.OrderService.entity;

import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ORDERS")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Order {
    @Id
    private String orderId;

    private String userId; // Customer who placed the order
    private String shopId; // Shop that sells the order

    private BigDecimal subTotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal grandTotal;

    private String paymentMethod;

    @Column(name = "shipperId")
    private String shipperId;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    // Manager verification metadata
    private Boolean isVerified;
    private String verifiedBy;

    // One-to-many relationship with order items
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    // One-to-one relationship with shipping address
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private OrderAddress orderAddress;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}