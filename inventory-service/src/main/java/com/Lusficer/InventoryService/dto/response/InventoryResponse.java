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
    
    private Integer totalQuantity;      
    private Integer reservedQuantity;   
    private Integer availableQuantity;  
    
    private Integer safetyStockLevel;   
}