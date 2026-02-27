package com.Lusficer.FulfillmentService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "SHIPMENT")
@Data
public class Shipment {
    @Id
    private String shipmentId; // Mã vận đơn (VD: SHIP-12345)

    @Column(nullable = false)
    private String orderId;    // Link tới Order Service

    @Column(nullable = false)
    private String shopId;     // Link tới Product Service

    @Column(nullable = false)
    private String vendorId;   // Link tới User Service

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;

    private String trackingNumber;
    private String labelUrl;   // Link file PDF

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ShipmentItem> items;

    // Audit Log
    private LocalDateTime createdAt;
    private LocalDateTime packedAt;
    private LocalDateTime warehouseReceivedAt;
    private LocalDateTime dispatchedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = ShipmentStatus.NEW;
    }
}