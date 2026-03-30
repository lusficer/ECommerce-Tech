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

    /**
     * Returns product details for internal consumers.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductInternalDto> getProductDetail(@PathVariable("id") String id) {
        return ResponseEntity.ok(productService.getProductForInternal(id));
    }

    /**
     * Returns products by ID list for internal consumers.
     */
    @GetMapping("/batch")
    public ResponseEntity<List<ProductInternalDto>> getProductsByIds(@RequestParam("ids") List<String> ids) {
        return ResponseEntity.ok(productService.getProductsBatch(ids));
    }
    
    /**
     * Returns product names by ID list for internal consumers.
     */
    @PostMapping("/batch-names")
    @Operation(summary = "Batch fetch product names by list of IDs (POST body)")
    public ResponseEntity<Map<String, String>> getProductNames(@RequestBody List<String> ids) {
        return ResponseEntity.ok(productService.getProductNamesBatch(ids));
    }

    /**
     * Returns trending products based on sales.
     */
    @GetMapping("/trending")
    public ResponseEntity<List<ProductInternalDto>> getTrendingProducts() {
        return ResponseEntity.ok(productService.getTrendingProducts());
    }

    /**
     * Searches products by keyword for internal consumers.
     */
    @GetMapping("/search")
    public ResponseEntity<List<ProductInternalDto>> searchProducts(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(productService.searchProductsInternal(keyword));
    }

    /**
     * Returns public products for a shop.
     */
    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<ProductInternalDto>> getShopPublicProducts(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(productService.getPublicProductsByShopId(shopId));
    }

    /**
     * Filters products by criteria for internal consumers.
     */
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