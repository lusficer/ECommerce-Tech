package com.Lusficer.StatisticsService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "DAILY_SALES_STATS")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DailySalesStats {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long statId;

    private String shopId;
    private LocalDate date;

    private BigDecimal totalRevenue;
    private Integer totalOrders;
    private Integer totalItemsSold;
    private Integer cancelledOrders;

    private LocalDateTime updatedAt;
}