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
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}