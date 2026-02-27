package com.Lusficer.DisputeService.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ResolveDisputeRequest {
    private String resolutionType; // APPROVED, REJECTED
    private String resolutionSummary; // Biên bản giải quyết
    private BigDecimal refundAmount; // Nếu có
    private String managerId;
}