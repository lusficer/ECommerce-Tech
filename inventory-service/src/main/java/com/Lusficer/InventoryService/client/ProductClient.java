package com.Lusficer.InventoryService.client;

import com.Lusficer.InventoryService.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service", url = "http://localhost:8083") 
public interface ProductClient {
    @GetMapping("/api/internal/products/{id}") 
    ProductDto getProductById(@PathVariable("id") String id);
}