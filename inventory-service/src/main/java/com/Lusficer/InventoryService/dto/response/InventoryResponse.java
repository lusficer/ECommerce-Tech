package com.Lusficer.InventoryService.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {
    private String productId;
    private String sku;
    
    private Integer totalQuantity;      // Tổng số lượng trong kho
    private Integer reservedQuantity;   // Số lượng đang bị giữ
    private Integer availableQuantity;  // Số lượng thực tế có thể bán (Total - Reserved)
    
    private Integer safetyStockLevel;   // Mức cảnh báo
}