package com.Lusficer.RecommendationService.dto.request;

import com.Lusficer.RecommendationService.enums.ActionType;
import lombok.Data;

@Data
public class TrackingRequest {
    // Chỉ giữ lại những gì Client cần gửi
    private String productId;
    private String categoryId;
    private ActionType actionType;
    private String searchKeyword;
    private Integer dwellTimeMs;
}