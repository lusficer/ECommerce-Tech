package com.Lusficer.OrderService.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import com.Lusficer.OrderService.enums.ShippingStatus;
@Entity
@Table(name = "SHIPPING")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long shippingId;

    // One-to-one mapping to order (one order per shipment)
    @Column(nullable = false, unique = true)
    private String orderId;

    // Shipper identifier (for example: SHIPPER_001)
    @Column(nullable = false)
    private String shipperId;

    // Detailed shipping status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShippingStatus status;

    // Additional shipper note (for example: "Deliver in the afternoon")
    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}