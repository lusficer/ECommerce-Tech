package com.Lusficer.ShopService.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for updating shop profile information.
 */
public record UpdateShopProfileRequest(
        @NotBlank String shopName,
        @NotBlank String address,
        String description,
        String logoUrl
) {}