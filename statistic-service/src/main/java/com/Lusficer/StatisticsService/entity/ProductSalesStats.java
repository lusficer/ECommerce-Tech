package com.Lusficer.StatisticsService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PRODUCT_SALES_STATS")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductSalesStats {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long statId;

    private String productId;
    private String shopId;
    private String productName;

    private Integer totalSold;
    private BigDecimal totalRevenue;
    private LocalDateTime lastSoldAt;
}