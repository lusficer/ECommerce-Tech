package com.Lusficer.UserService.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "Response for deactivation request")
public record DeactivateAccountResponse(
        @Schema(description = "Request ID")
        Long requestId,
        
        @Schema(description = "User ID")
        String userId,
        
        @Schema(description = "Request status: PENDING, APPROVED, REJECTED")
        String status,
        
        @Schema(description = "Request creation date")
        LocalDateTime requestDate,
        
        @Schema(description = "Message")
        String message
) {
}
