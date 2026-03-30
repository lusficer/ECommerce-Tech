package com.Lusficer.ProductService.controller;

import com.Lusficer.ProductService.dto.request.ReviewRequestDTO;
import com.Lusficer.ProductService.dto.response.ReviewResponseDTO;
import com.Lusficer.ProductService.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@SecurityRequirement(name = "Bearer Token") 
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Operations related to product ratings and reviews")
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Adds a review for a product.
     */
    @PostMapping
    @Operation(summary = "Add a new review for a product")
    public ResponseEntity<ReviewResponseDTO> addReview(
            @PathVariable("productId") String productId,
            @RequestHeader("userId") String userId,
            @Valid @RequestBody ReviewRequestDTO request) {
        
        ReviewResponseDTO response = reviewService.addReview(productId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns reviews for a product.
     */
    @GetMapping
    @Operation(summary = "Get all reviews for a product")
    public ResponseEntity<List<ReviewResponseDTO>> getProductReviews(
            @PathVariable("productId") String productId) {
        
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }
}