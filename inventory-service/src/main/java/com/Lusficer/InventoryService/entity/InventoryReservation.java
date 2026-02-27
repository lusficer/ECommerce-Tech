package com.Lusficer.InventoryService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INVENTORY_RESERVATION")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryReservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;
    
    private String orderId;
    private String productId;
    private Integer quantity;
    private LocalDateTime expiryTime;
}