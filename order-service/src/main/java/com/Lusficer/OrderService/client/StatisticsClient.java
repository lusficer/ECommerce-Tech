// File: src/main/java/com/Lusficer/OrderService/client/StatisticsClient.java
package com.Lusficer.OrderService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;
import lombok.AllArgsConstructor;

@FeignClient(name = "statistic-service", url= "http://localhost:8087") 
public interface StatisticsClient {

    @PostMapping("/api/internal/stats/sync-order")
    void syncOrder(@RequestBody OrderCompletedEvent event);

    // DTO dùng để gửi dữ liệu đi
    @Data @AllArgsConstructor
    class OrderCompletedEvent {
        private String shopId;
        private BigDecimal totalAmount;
        private LocalDate orderDate;
        private List<ProductItemDto> items;
    }

    @Data @AllArgsConstructor
    class ProductItemDto {
        private String productId;
        private String productName;
        private Integer quantity;
        private BigDecimal subTotal;
    }
}