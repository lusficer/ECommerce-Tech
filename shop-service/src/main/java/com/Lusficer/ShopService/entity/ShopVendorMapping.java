package com.Lusficer.ShopService.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "SHOP_VENDOR_MAPPING")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopVendorMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String shopId;

    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String status; // "ACTIVE" or "INACTIVE"

    @Column(updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
    }
}