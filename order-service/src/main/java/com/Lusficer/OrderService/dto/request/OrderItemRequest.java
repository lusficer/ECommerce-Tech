package com.Lusficer.OrderService.dto.request;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemRequest {
    private String productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private BigDecimal unitPrice;
}