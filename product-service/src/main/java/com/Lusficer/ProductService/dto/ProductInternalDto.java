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
    private String description;
    private String categoryId;
    private String brand;
    private String specifications;
    private String mainImage;
    private BigDecimal price;
    private Double averageRating;
    private Integer totalReviews;
    private Integer discountPercentage;
    private Integer stock;
    private String shopId;

}