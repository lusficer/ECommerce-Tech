package com.Lusficer.ShopService.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShopStatusRequest {
    @NotBlank(message = "status is required")
    private String status;
    private String reason;
}
