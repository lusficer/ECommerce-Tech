package com.Lusficer.RecommendationService.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class RecommendationResponse {
    private String userId;
    private String strategy; // "PERSONALIZED" hoặc "TRENDING"
    private List<RecommendationItemDto> urgentItems;    // Mục FOMO (Màu đỏ)
    private List<RecommendationItemDto> suggestedItems; // Mục thường
}