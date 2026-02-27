// shop-service/src/main/java/com/Lusficer/ShopService/dto/UpdateShopProfileRequest.java
package com.Lusficer.ShopService.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateShopProfileRequest(
        @NotBlank String shopName,
        @NotBlank String address,
        String description,
        String logoUrl
) {}