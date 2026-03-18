package com.Lusficer.ProductService.dto;

import lombok.Data;

@Data
public class InventoryDto {
    private String productId;
    private Integer availableQuantity; 
}