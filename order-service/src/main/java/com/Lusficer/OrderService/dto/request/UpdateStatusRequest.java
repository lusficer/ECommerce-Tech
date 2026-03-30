package com.Lusficer.OrderService.dto.request;
import lombok.Data;

/**
 * Request DTO for vendor to update order status.
 */
@Data
public class UpdateStatusRequest {
    private String shopId;
    private String newStatus;
}