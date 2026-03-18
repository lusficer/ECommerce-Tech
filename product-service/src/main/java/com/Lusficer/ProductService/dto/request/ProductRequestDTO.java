package com.Lusficer.ProductService.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequestDTO {
    
    private String name;
    private String categoryId;
    private String description;
    private String brand;
    private String specifications;
    private BigDecimal price;
    private Integer discountPercentage;
    private Integer stockQuantity;
    private String imageUrl;
    private Integer lowStockThreshold;
}