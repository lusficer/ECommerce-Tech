package com.Lusficer.CartService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.Lusficer.CartService.dto.ProductInternalDto;

@FeignClient(name = "product-service", url = "http://localhost:8083")
public interface ProductClient {
    
    @GetMapping("/api/internal/products/{productId}")
    ProductInternalDto getProductDetail(@PathVariable("productId") String productId);
}

