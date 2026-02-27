package com.Lusficer.RecommendationService.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class RecommendationItemDto {
    private String productId;
    private String name;
    private Double price;
    private String imageUrl;
    
    private Integer stockLeft; // Tồn kho thực tế
    private String badge;      // Nhãn FOMO (🔥 SẮP CHÁY HÀNG)
    private String reason;     // Lý do gợi ý
}