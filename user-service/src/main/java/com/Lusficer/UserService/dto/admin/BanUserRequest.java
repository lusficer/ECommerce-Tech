package com.Lusficer.UserService.dto.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BanUserRequest {
    @NotNull(message = "banned is required")
    private Boolean banned;
    private String reason;
}
