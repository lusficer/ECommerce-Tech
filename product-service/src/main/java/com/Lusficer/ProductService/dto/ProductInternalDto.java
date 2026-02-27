package com.Lusficer.ProductService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductInternalDto {
    private String productId;
    private String name;
    private String mainImage;
    private BigDecimal price;
    private Integer stock;
    private String shopId;
}