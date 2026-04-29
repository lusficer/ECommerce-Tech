package com.Lusficer.OrderService.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ShipperAvailableOrderDTO {

    private String orderId;
    private String shopId;
    private BigDecimal grandTotal;

    // Pickup (warehouse)
    private String pickupAddress;
    private String pickupCity;
    private String pickupDistrict;
    private String pickupWard;
    private String pickupPhone;

    // Delivery
    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryDistrict;
    private String deliveryWard;
    private String deliveryPhone;

    private List<OrderItemDTO> items;

    @Data
    @Builder
    public static class OrderItemDTO {
        private String productId;
        private String productName;
        private String productImage;
        private Integer quantity;
    }
}
