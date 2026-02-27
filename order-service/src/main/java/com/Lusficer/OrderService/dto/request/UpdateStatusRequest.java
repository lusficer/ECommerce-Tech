// File: UpdateStatusRequest.java (Vendor dùng)
package com.Lusficer.OrderService.dto.request;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    private String shopId;   // Để check quyền sở hữu
    private String newStatus; // VD: "PROCESSING", "READY_TO_SHIP"
}