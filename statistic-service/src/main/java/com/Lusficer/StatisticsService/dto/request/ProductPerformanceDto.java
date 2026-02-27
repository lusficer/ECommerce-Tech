package com.Lusficer.StatisticsService.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data @AllArgsConstructor
public class ProductPerformanceDto {
    private String productName;
    private Integer quantitySold;
    private BigDecimal revenueGenerated;
}