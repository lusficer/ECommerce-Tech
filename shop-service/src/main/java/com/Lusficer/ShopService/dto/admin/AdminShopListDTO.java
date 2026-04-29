package com.Lusficer.ShopService.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminShopListDTO {
    private String shopId;
    private String shopName;
    private String status;
    private String vendorId;
    private String managerId;
    private String deactivationReason;
    private LocalDateTime createdAt;
    private LocalDateTime deactivatedAt;
}
