package com.Lusficer.ProductService.controller;

import com.Lusficer.ProductService.dto.request.ProductRequestDTO;
import com.Lusficer.ProductService.entity.Product;
import com.Lusficer.ProductService.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor/products")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Vendor Products", description = "Product management for vendors (Vendor only)")
public class VendorProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(
        summary = "Create a new product",
        description = "Vendor creates a new product listing. Product will be in DRAFT status and sent to manager for approval. Requires VENDOR role.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(
        responseCode = "200",
        description = "Product created successfully",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = Product.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid product data")
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token")
    @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions (VENDOR role required)")
    public ResponseEntity<Product> createProduct(
            @RequestHeader("SHOP-ID") String shopId,
            @Valid @org.springframework.web.bind.annotation.RequestBody ProductRequestDTO request) {
        return ResponseEntity.ok(productService.createProduct(shopId, request));
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(
        summary = "Update an existing product",
        description = "Vendor updates a product listing. Requires VENDOR role.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(
        responseCode = "200",
        description = "Product updated successfully",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = Product.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid product data or product not found")
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token")
    @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions (VENDOR role required)")
    public ResponseEntity<Product> updateProduct(
            @RequestHeader("X-Shop-Id") String shopId,
            @PathVariable String productId,
            @Valid @org.springframework.web.bind.annotation.RequestBody ProductRequestDTO request) {
        return ResponseEntity.ok(productService.updateProduct(productId, shopId, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(
        summary = "Get my products (vendor view)",
        description = "Retrieve all products for the authenticated vendor shop. Requires VENDOR role.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(
        responseCode = "200",
        description = "Products retrieved successfully",
        content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = Product.class)))
    )
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token")
    @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions (VENDOR role required)")
    public ResponseEntity<List<Product>> getMyProducts(@RequestHeader("X-Shop-Id") String shopId) {
        return ResponseEntity.ok(productService.getVendorProducts(shopId));
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("hasAnyAuthority('ROLE_VENDOR','ROLE_SELLER')")
    public ResponseEntity<Void> deleteProductVendor(@PathVariable String productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.ok().build();
    }
}