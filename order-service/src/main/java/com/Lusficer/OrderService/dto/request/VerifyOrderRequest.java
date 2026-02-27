// File: VerifyOrderRequest.java (Manager dùng)
package com.Lusficer.OrderService.dto.request;
import lombok.Data;

@Data
public class VerifyOrderRequest {
    private String managerId;
    private boolean approved; // true = Approve, false = Reject
    private String reason;    // Lý do (nếu từ chối)
}