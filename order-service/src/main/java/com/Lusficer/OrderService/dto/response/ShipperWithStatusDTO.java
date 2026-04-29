package com.Lusficer.OrderService.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShipperWithStatusDTO {
    private String shipperId;
    private String fullName;
    private String phone;
    private String status;           // AVAILABLE, UNAVAILABLE, ON_DELIVERY
    private String unavailableReason;
}