package com.Lusficer.StatisticsService.controller;

import com.Lusficer.StatisticsService.service.StatisticsService;
import com.Lusficer.StatisticsService.dto.ProductItemDto; // Đã import cái này
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/internal/stats")
public class StatisticsInternalController {

    @Autowired private StatisticsService statsService;

    @PostMapping("/sync-order")
    public ResponseEntity<String> syncOrder(@RequestBody OrderCompletedEvent event) {
        statsService.recordOrderCompletion(
            event.getShopId(), 
            event.getTotalAmount(), 
            event.getItems()
        );
        return ResponseEntity.ok("Synced");
    }
    
    @Data 
    @NoArgsConstructor 
    @AllArgsConstructor
    public static class OrderCompletedEvent {
        private String shopId;
        private BigDecimal totalAmount;
        private List<ProductItemDto> items; 
    }
}