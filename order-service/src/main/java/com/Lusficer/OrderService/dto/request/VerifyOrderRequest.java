package com.Lusficer.OrderService.dto.request;
import lombok.Data;

@Data
public class VerifyOrderRequest {
    private String managerId;
    private boolean approved; // true = approve, false = reject
    private String reason;    // rejection reason (if any)
    private Boolean riskAcknowledged; // required when riskLevel=HIGH and approved=true
}