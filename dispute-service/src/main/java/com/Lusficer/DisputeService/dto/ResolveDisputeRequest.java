package com.Lusficer.DisputeService.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ResolveDisputeRequest {
    private String resolutionType; // APPROVED or REJECTED
    private String resolutionSummary; // Resolution summary
    private BigDecimal refundAmount; // Optional
    private String managerId;
}