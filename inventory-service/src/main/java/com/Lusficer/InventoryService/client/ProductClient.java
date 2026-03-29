package com.Lusficer.InventoryService.client;

import com.Lusficer.InventoryService.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "product-service", url = "http://localhost:8083")
public interface ProductClient {

    // ─────────────────────────────────────────────────────────────────────────
    // OLD (N+1 — DO NOT USE in forecast loop):
    //   getProductById(id) called inside for-each = ~1300 separate HTTP calls
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/api/internal/products/{id}")
    ProductDto getProductById(@PathVariable("id") String id);

    
    @GetMapping("/api/internal/products/shop/{shopId}")
    List<ProductDto> getProductsByShop(@PathVariable("shopId") String shopId);

    @PostMapping("/api/internal/products/batch-names")
    Map<String, String> getProductNames(@RequestBody List<String> ids);
}