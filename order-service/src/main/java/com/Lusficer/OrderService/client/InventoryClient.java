package com.Lusficer.OrderService.client;

import com.Lusficer.OrderService.dto.request.StockRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @PostMapping("/api/internal/inventory/reserve")
    void reserveStock(@RequestBody StockRequest req);

    @PostMapping("/api/internal/inventory/release/{orderId}")
    void releaseStock(@PathVariable("orderId") String orderId);

    @PostMapping("/api/internal/inventory/confirm/{orderId}")
    void confirmSale(@PathVariable("orderId") String orderId);
}