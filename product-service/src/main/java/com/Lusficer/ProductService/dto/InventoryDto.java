package com.Lusficer.ProductService.dto;

import lombok.Data;

@Data
public class InventoryDto {
    private String productId;
    private Integer availableQuantity; // Chúng ta chỉ cần quan tâm số này để hiển thị
}