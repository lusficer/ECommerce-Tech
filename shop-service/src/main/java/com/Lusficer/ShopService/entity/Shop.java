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

    @Column(name = "warehouseAddress")
    @Schema(description = "Warehouse address (fallback to shop address when null)")
    private String warehouseAddress;

    @Column(name = "warehouseCity")
    @Schema(description = "Warehouse city")
    private String warehouseCity;

    @Column(name = "warehouseDistrict")
    @Schema(description = "Warehouse district")
    private String warehouseDistrict;

    @Column(name = "warehouseWard")
    @Schema(description = "Warehouse ward")
    private String warehouseWard;

    @Column(name = "warehousePhone")
    @Schema(description = "Warehouse contact phone")
    private String warehousePhone;

    @Column(name = "description")
    @Schema(description = "Description of the shop")
    private String description;

    @Lob 
    @Column(name = "logoUrl", columnDefinition = "LONGTEXT")
    @Schema(description = "URL of the shop logo")
    private String logoUrl;

    @Column(name = "managerId")
    @Schema(description = "Manager's user ID")
    private String managerId;

    @Column(name = "vendorId")
    @Schema(description = "Vendor's user ID")
    private String vendorId;

    @Column(name = "status")
    @Schema(description = "Current status of the shop")
    private String status;

    @Column(name = "deactivatedAt")
    @Schema(description = "Deactivation timestamp")
    private LocalDateTime deactivatedAt;

    @Column(name = "deactivationReason", columnDefinition = "TEXT")
    @Schema(description = "Reason for deactivation")
    private String deactivationReason;

    @Column(name = "restoreUntil")
    @Schema(description = "Restoration deadline for deactivated shops")
    private LocalDateTime restoreUntil;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
