package com.Lusficer.StatisticsService.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor 
@AllArgsConstructor
public class ProductItemDto {
    private String productId;
    private String productName;
    private Integer quantity;
    private BigDecimal subTotal;
}