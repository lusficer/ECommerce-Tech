package com.Lusficer.ProductService.controller;

import com.Lusficer.ProductService.entity.Category;
import com.Lusficer.ProductService.service.CategoryService;
import com.Lusficer.ProductService.service.ProductService;
import com.Lusficer.ProductService.dto.ProductInternalDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductService productService; 

    /**
     * Returns active categories.
     */
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }

    /**
     * Returns products for a category.
     */
    @GetMapping("/{categoryId}/products")
    public ResponseEntity<List<ProductInternalDto>> getProductsByCategory(@PathVariable("categoryId") String categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }
}