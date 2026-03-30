package com.Lusficer.OrderService.dto.request;

import com.Lusficer.OrderService.enums.ShippingStatus;
import lombok.Data;

@Data
public class ShippingRequestDTO {
    // Shipper ID is taken from header/token, not from request body.
    private String orderId;
    private ShippingStatus status;
    private String note;
}