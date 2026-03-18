package com.Lusficer.RecommendationService.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class RecommendationResponse {
    private String userId;
    private String strategy; 
    private List<RecommendationItemDto> urgentItems;    
    private List<RecommendationItemDto> suggestedItems; 
}