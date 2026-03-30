package com.Lusficer.OrderService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ORDER_TRACKING")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderTracking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long trackingId;

    @ManyToOne
    @JoinColumn(name = "orderId")
    @JsonIgnore
    @ToString.Exclude
    private Order order;

    private String shipmentId;
    private String trackingNumber;
    private String carrierName;
    private String displayStatus;
    private String description;

    private LocalDateTime updatedAt;
}