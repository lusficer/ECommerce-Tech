package com.Lusficer.UserService.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to deactivate user account")
public record DeactivateAccountRequest(
        @NotBlank(message = "Reason is required")
        @Schema(description = "Reason for account deactivation")
        String reason
) {
}
