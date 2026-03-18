package com.Lusficer.RecommendationService.dto.request;

import com.Lusficer.RecommendationService.enums.ActionType;
import lombok.Data;

@Data
public class TrackingRequest {
    private String productId;
    private String categoryId;
    private ActionType actionType;
    private String searchKeyword;
    private Integer dwellTimeMs;
}