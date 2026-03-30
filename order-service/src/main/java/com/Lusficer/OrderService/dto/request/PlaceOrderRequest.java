package com.Lusficer.OrderService.dto.request;
import lombok.Data;
import java.util.List;

@Data
public class PlaceOrderRequest {
    private String userId; // Resolved from token/header
    private String shopId;
    private String paymentMethod;
    private List<OrderItemRequest> items;
    private OrderAddressRequest address;
}