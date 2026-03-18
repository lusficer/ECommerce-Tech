package com.Lusficer.InventoryService.dto;

import com.Lusficer.InventoryService.entity.StockLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLogDto {
    private Long logId;
    private String productId;
    private String orderId;
    private StockLog.LogType type; // IMPORT, RESERVE, RELEASE...
    private Integer changeAmount;  
    private Integer currentStock; 
    private String note;
    private LocalDateTime createdAt;
}