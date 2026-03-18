package com.Lusficer.RecommendationService.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class RecommendationItemDto {
    private String productId;
    private String name;
    private Double price;
    private String mainImage;
    
    private Integer stockLeft; 
    private String badge;      
    private String reason;    
}