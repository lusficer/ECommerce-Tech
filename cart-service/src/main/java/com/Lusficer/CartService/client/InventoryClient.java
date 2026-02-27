package com.Lusficer.CartService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// [NEW] Gọi trực tiếp sang Inventory Service
@FeignClient(name = "inventory-service")
public interface InventoryClient {
    
    // API này bên Inventory trả về con số Integer (số thực tế có thể bán)
    @GetMapping("/api/internal/inventory/{productId}/available")
    Integer getAvailableStock(@PathVariable("productId") String productId);
}