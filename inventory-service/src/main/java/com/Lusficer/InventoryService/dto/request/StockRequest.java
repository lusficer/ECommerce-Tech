package com.Lusficer.InventoryService.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class StockRequest {
    private String productId;
    private Integer quantity;
    private String orderId;
}