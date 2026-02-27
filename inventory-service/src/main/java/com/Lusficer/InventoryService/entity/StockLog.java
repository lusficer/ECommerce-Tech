package com.Lusficer.InventoryService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "STOCK_LOG")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;
    
    private String productId;
    private String orderId;
    
    @Enumerated(EnumType.STRING)
    private LogType type; // Enum: IMPORT, RESERVE, CONFIRM_SALE, RELEASE
    
    private Integer changeAmount;
    private Integer currentStock; // Lưu lại số tồn kho tại thời điểm log
    private String note;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    
    public enum LogType {
        IMPORT, RESERVE, CONFIRM_SALE, RELEASE, RETURN
    }
}