package com.Lusficer.InventoryService.client;

import com.Lusficer.InventoryService.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// name: phải trùng với spring.application.name trong file properties của Product Service
@FeignClient(name = "product-service", url = "http://localhost:8083") // Lưu ý: check lại port của Product Service
public interface ProductClient {

    // Gọi API lấy chi tiết sản phẩm bên Product Service
    // Giả sử bên Product có API: GET /api/public/products/{id}
    @GetMapping("/api/internal/products/{id}") 
    ProductDto getProductById(@PathVariable("id") String id);
}