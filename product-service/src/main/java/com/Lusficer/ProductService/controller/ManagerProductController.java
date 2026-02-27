package com.Lusficer.ProductService.controller;

import com.Lusficer.ProductService.dto.ApprovalReviewDTO;
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
@RequestMapping("/api/manager/products")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Manager Products", description = "Product approval and review management (Manager only)")
public class ManagerProductController {

    @Autowired
    private ProductService productService;

    // UC: Manage Product Approval Queue [cite: 16]
    @GetMapping("/queue")
    @PreAuthorize("hasAnyAuthority('ROLE_SHOP_MANAGER','ROLE_MANAGER')")
    @Operation(
        summary = "Get product approval queue",
        description = "Retrieve all products waiting for manager approval. Requires MANAGER role.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(
        responseCode = "200",
        description = "Approval queue retrieved successfully",
        content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = Product.class)))
    )
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token")
    @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions (MANAGER role required)")
    public ResponseEntity<List<Product>> getApprovalQueue() {
        return ResponseEntity.ok(productService.getApprovalQueue());
    }

    // ManagerProductController.java
    // UC: View Product Detail for Review 
    @GetMapping("/{productId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SHOP_MANAGER','ROLE_MANAGER')")
    @Operation(
        summary = "Get product details",
        description = "Retrieve full details of a specific product. Used by manager to review content before approval.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(responseCode = "200", description = "Product details retrieved")
    @ApiResponse(responseCode = "404", description = "Product not found")
    public ResponseEntity<Product> getProductDetail(@PathVariable("productId") String productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }


    // UC: Review Product Listing (Approve/Reject)  & Feedback 
    @PostMapping("/{productId}/review")
    @PreAuthorize("hasAnyAuthority('ROLE_SHOP_MANAGER','ROLE_MANAGER')")
    @Operation(
        summary = "Review product (approve or reject)",
        description = "Manager reviews a product submission and provides approval or rejection decision(True is approve and False is reject). Requires MANAGER role.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(
        responseCode = "200",
        description = "Product review submitted successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or product not found")
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token")
    @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions (MANAGER role required)")
    public ResponseEntity<String> reviewProduct(
            @PathVariable("productId") String productId,
            @Valid @org.springframework.web.bind.annotation.RequestBody ApprovalReviewDTO reviewDTO) {
        productService.reviewProduct(productId, reviewDTO);
        return ResponseEntity.ok("Product review submitted successfully");
    }
}