package com.Lusficer.OrderService.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import com.Lusficer.OrderService.enums.ShippingStatus;

@Entity
@Table(name = "SHIPPING_PHOTOS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long shippingId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShippingStatus photoType; // PICKING_UP, DELIVERED, FAILED, RETURNED

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}