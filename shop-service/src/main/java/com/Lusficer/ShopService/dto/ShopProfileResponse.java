package com.Lusficer.ShopService.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record ShopProfileResponse(
        String shopId,
        String shopName,
        String address,
        String description,
        String logoUrl,
        String status,
        String managerId,
        String vendorId,
        String warehouseAddress,
        String warehouseCity,
        String warehouseDistrict,
        String warehouseWard,
        String warehousePhone,
        LocalDateTime deactivatedAt,
        String deactivationReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
