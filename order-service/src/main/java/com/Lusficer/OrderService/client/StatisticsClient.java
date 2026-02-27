// File: src/main/java/com/Lusficer/OrderService/client/StatisticsClient.java
package com.Lusficer.OrderService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;
import lombok.AllArgsConstructor;

// "statistic-service" là tên application.name bạn đặt trong file properties của Service Thống kê
@FeignClient(name = "statistic-service") 
public interface StatisticsClient {

    @PostMapping("/api/internal/stats/sync-order")
    void syncOrder(@RequestBody OrderCompletedEvent event);

    // DTO dùng để gửi dữ liệu đi
    @Data @AllArgsConstructor
    class OrderCompletedEvent {
        private String shopId;
        private BigDecimal totalAmount;
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