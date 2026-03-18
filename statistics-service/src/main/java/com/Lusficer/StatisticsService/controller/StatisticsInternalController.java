package com.Lusficer.StatisticsService.controller;

import com.Lusficer.StatisticsService.service.StatisticsService;
import com.Lusficer.StatisticsService.dto.ProductItemDto; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
@RestController
@RequestMapping("/api/internal/stats")
public class StatisticsInternalController {

    @Autowired private StatisticsService statsService;

    @PostMapping("/sync-order")
    public ResponseEntity<String> syncOrder(@RequestBody OrderCompletedEvent event) {
        statsService.recordOrderCompletion(
            event.getShopId(), 
            event.getTotalAmount(), 
            event.getItems(),
            event.getOrderDate()
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
        private LocalDate orderDate;
    }
}