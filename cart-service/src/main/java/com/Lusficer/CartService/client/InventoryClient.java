package com.Lusficer.CartService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "inventory-service", url = "http://localhost:8089")
public interface InventoryClient {
    
    @GetMapping("/api/internal/inventory/{productId}/available")
    Integer getAvailableStock(@PathVariable("productId") String productId);
}