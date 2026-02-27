package com.Lusficer.ShopService.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record DeactivateShopResponse(
        String shopId,
        String status,
        LocalDateTime deactivatedAt,
        LocalDateTime canRestoreUntil
) {}