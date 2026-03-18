// File: Order.java
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

    private String userId; // User đặt
    private String shopId; // Shop bán

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

    // Dành cho Manager verify
    private Boolean isVerified;
    private String verifiedBy;

    // Quan hệ 1-N với OrderItem
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    // Quan hệ 1-1 với Address
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private OrderAddress orderAddress;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}