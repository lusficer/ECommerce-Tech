package com.Lusficer.ProductService.client;

import com.Lusficer.ProductService.dto.InventoryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Gọi sang Inventory Service
@FeignClient(name = "inventory-service") 
public interface InventoryClient {
    
    // Gọi API xem chi tiết mà bạn đã viết bên Inventory Service
    @GetMapping("/api/internal/inventory/{productId}")
    InventoryDto getInventoryDetail(@PathVariable("productId") String productId);
}