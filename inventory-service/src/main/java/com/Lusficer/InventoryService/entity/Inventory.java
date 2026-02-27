package com.Lusficer.InventoryService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INVENTORY")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Inventory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;
    
    @Column(unique = true)
    private String productId;

    private String sku;
    private Integer safetyStockLevel;

    @Column(name = "last_trend_slope")
    private Double lastTrendSlope;      
    
    @Column(name = "last_forecast_date")
    private LocalDateTime lastForecastDate; 

    private Integer quantity;
    private Integer reservedQuantity;
}