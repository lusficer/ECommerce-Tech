package com.Lusficer.ProductService.client;

import com.Lusficer.ProductService.dto.InventoryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;
import java.util.Map;
@FeignClient(name = "inventory-service", url = "http://localhost:8089")
public interface InventoryClient {
    @PostMapping("/api/internal/inventory/update-stock")
    void updateStock(@RequestParam("productId") String productId, @RequestParam("quantity") int quantity);
    
    @GetMapping("/api/internal/inventory/{productId}")
    InventoryDto getInventoryDetail(@PathVariable("productId") String productId);

    @GetMapping("/api/internal/inventory/check-stock")
    Map<String, Integer> checkStockBatch(@RequestParam("productIds") List<String> productIds);
}