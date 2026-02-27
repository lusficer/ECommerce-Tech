package com.Lusficer.RecommendationService.dto;

import lombok.Data;

@Data
public class ProductDto {
    private String productId;
    private String name;
    private Double price;
    private String imageUrl;
}