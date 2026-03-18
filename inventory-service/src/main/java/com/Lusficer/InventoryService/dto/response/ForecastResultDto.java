package com.Lusficer.InventoryService.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastResultDto {
    private String productId;
    
    private String productName; 

    private Double trendSlope;
    private Double predictedNextDay;
    
    private String trendLabel; 
    
    private String aiRecommendation;

    private Integer oldSafetyStock;
    private Integer newSafetyStock;
    private String status;
}