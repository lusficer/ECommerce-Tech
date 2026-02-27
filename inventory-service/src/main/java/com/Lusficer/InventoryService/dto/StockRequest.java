package com.Lusficer.InventoryService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockRequest {
    // ID đơn hàng cần giữ
    private String orderId;
    
    // Sản phẩm cần giữ
    private String productId;
    
    // Số lượng cần giữ
    private Integer quantity;
}