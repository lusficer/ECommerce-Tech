// File: PlaceOrderRequest.java
package com.Lusficer.OrderService.dto.request;
import lombok.Data;
import java.util.List;

@Data
public class PlaceOrderRequest {
    private String userId; // Thực tế lấy từ Token
    private String shopId;
    private String paymentMethod;
    private List<OrderItemRequest> items;
    private OrderAddressRequest address;
}