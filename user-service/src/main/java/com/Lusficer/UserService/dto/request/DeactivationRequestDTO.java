package com.Lusficer.UserService.dto.request;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
@Schema(description = "Data Transfer Object for deactivation request details")
public record DeactivationRequestDTO(
        @Schema(description = "Request ID")
        Long requestId,
        
        @Schema(description = "User ID requesting deactivation")
        String userId,
        
        @Schema(description = "Reason for deactivation")
        String reason,
        
        @Schema(description = "Request status: PENDING, APPROVED, REJECTED")
        String status,
        
        @Schema(description = "Date when request was created")
        LocalDateTime requestDate,
        
        @Schema(description = "Admin ID who reviewed the request")
        String approverId,
        
        @Schema(description = "Date when admin reviewed the request")
        LocalDateTime approvalDate,
        
        @Schema(description = "Admin's reason for approval/rejection")
        String approvalReason
) {
}
