// shop-service/src/main/java/com/Lusficer/ShopService/entity/Shop.java
package com.Lusficer.ShopService.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "SHOP", schema = "eCommerce_shop_service")
@Schema(description = "Shop entity representing a seller shop")
public class Shop {
    @Id
    @Column(name = "shopId")
    @Schema(description = "Unique shop identifier")
    private String shopId;

    @Column(name = "shopName")
    @Schema(description = "Name of the shop")
    private String shopName;

    @Column(name = "address")
    @Schema(description = "Address of the shop")
    private String address;

    @Column(name = "description")
    @Schema(description = "Description of the shop")
    private String description;

    @Lob 
    @Column(name = "logoUrl", columnDefinition = "LONGTEXT")
    @Schema(description = "URL of the shop logo")
    private String logoUrl;

    @Column(name = "ownerId")
    @Schema(description = "Owner's user ID")
    private String ownerId;

    @Column(name = "status")
    @Schema(description = "Current status of the shop")
    private String status;

    @Column(name = "deactivatedAt")
    @Schema(description = "Deactivation timestamp")
    private LocalDateTime deactivatedAt;

    @Column(name = "restoreUntil")
    @Schema(description = "Restoration deadline for deactivated shops")
    private LocalDateTime restoreUntil;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}