package com.Lusficer.OrderService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SHIPPER_STATUS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipperStatus {

    @Id
    @Column(nullable = false)
    private String shipperId;

    @Column(nullable = false)
    private String status; // AVAILABLE, UNAVAILABLE, ON_DELIVERY

    @Column(nullable = true)
    private String unavailableReason;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}