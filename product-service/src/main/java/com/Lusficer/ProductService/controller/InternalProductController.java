package com.Lusficer.ProductService.controller;

import com.Lusficer.ProductService.dto.ProductInternalDto;
import com.Lusficer.ProductService.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internal/products")
public class InternalProductController {

    @Autowired
    private ProductService productService;
    
    // API cũ của bạn
    @GetMapping("/{id}")
    public ResponseEntity<ProductInternalDto> getProductDetail(@PathVariable("id") String id) {
        return ResponseEntity.ok(productService.getProductForInternal(id));
    }

    // [MỚI 1] API Batch: Lấy thông tin chi tiết của 1 danh sách ID
    // Dùng @RequestParam để nhận list từ URL: ?ids=PROD1,PROD2
    @GetMapping("/batch")
    public ResponseEntity<List<ProductInternalDto>> getProductsByIds(@RequestParam("ids") List<String> ids) {
        return ResponseEntity.ok(productService.getProductsBatch(ids));
    }

    // [MỚI 2] API Trending: Lấy danh sách sản phẩm mới nhất (Fallback)
    @GetMapping("/trending")
    public ResponseEntity<List<ProductInternalDto>> getTrendingProducts() {
        return ResponseEntity.ok(productService.getTrendingProducts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductInternalDto>> searchProducts(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(productService.searchProductsInternal(keyword));
    }
}