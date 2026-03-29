package com.Lusficer.RecommendationService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@FeignClient(name = "inventory-service", url = "http://localhost:8089") 
public interface InventoryClient {
    @GetMapping("/api/internal/inventory/check-stock") 
    Map<String, Integer> checkStockBatch(@RequestParam("productIds") List<String> productIds);

    @PostMapping("/api/internal/inventory/check-stock")
    Map<String, Integer> checkStockBatchPost(@RequestBody List<String> productIds);
}