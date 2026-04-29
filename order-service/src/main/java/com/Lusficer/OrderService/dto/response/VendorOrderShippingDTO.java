package com.Lusficer.OrderService.dto.response;

import com.Lusficer.OrderService.entity.Shipping;
import com.Lusficer.OrderService.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VendorOrderShippingDTO {
    private String orderId;
    private String shopId;
    private OrderStatus orderStatus;
    private String shipperId;
    private Shipping shipping;
}