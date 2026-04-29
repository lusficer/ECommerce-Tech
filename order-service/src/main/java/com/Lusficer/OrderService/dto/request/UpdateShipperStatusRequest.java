package com.Lusficer.OrderService.dto.request;

import lombok.Data;

@Data
public class UpdateShipperStatusRequest {
    private String status; // AVAILABLE, UNAVAILABLE, ON_DELIVERY
    private String unavailableReason; // chỉ cần khi status = UNAVAILABLE
}