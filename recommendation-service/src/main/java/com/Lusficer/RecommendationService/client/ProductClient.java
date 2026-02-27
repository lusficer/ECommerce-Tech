package com.Lusficer.RecommendationService.client;

import com.Lusficer.RecommendationService.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@FeignClient(name = "product-service", url = "http://localhost:8083") 
public interface ProductClient {
    @GetMapping("/api/internal/products/batch")
    List<ProductDto> getProductsByIds(@RequestParam("ids") List<String> ids);

    @GetMapping("/api/internal/products/trending")
    List<ProductDto> getTrendingProducts();

    @GetMapping("/api/internal/products/search") 
    List<ProductDto> searchProducts(@RequestParam("keyword") String keyword);
}