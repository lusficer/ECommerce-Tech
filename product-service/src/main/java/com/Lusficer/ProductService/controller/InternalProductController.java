package com.Lusficer.ProductService.controller;

import com.Lusficer.ProductService.dto.ProductInternalDto;
import com.Lusficer.ProductService.service.ProductService;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/products")
public class InternalProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/{id}")
    public ResponseEntity<ProductInternalDto> getProductDetail(@PathVariable("id") String id) {
        return ResponseEntity.ok(productService.getProductForInternal(id));
    }

    @GetMapping("/batch")
    public ResponseEntity<List<ProductInternalDto>> getProductsByIds(@RequestParam("ids") List<String> ids) {
        return ResponseEntity.ok(productService.getProductsBatch(ids));
    }
    
    @PostMapping("/batch-names")
    @Operation(summary = "Batch fetch product names by list of IDs (POST body)")
    public ResponseEntity<Map<String, String>> getProductNames(@RequestBody List<String> ids) {
        return ResponseEntity.ok(productService.getProductNamesBatch(ids));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<ProductInternalDto>> getTrendingProducts() {
        return ResponseEntity.ok(productService.getTrendingProducts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductInternalDto>> searchProducts(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(productService.searchProductsInternal(keyword));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<ProductInternalDto>> getShopPublicProducts(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(productService.getPublicProductsByShopId(shopId));
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<ProductInternalDto>> filterProducts(
            @RequestParam(value = "keyword",    required = false) String keyword,
            @RequestParam(value = "categoryId", required = false) String categoryId,
            @RequestParam(value = "brand",      required = false) String brand,
            @RequestParam(value = "minPrice",   required = false) Double minPrice,
            @RequestParam(value = "maxPrice",   required = false) Double maxPrice,
            @RequestParam(value = "page",       defaultValue = "0")  int page,
            @RequestParam(value = "size",       defaultValue = "16") int size,
            @RequestParam(value = "sort",       defaultValue = "latest") String sortOption) {

        return ResponseEntity.ok(
            productService.filterProductsInternal(keyword, categoryId, brand, minPrice, maxPrice, page, size, sortOption)
        );
    }
}