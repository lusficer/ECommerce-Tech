package com.Lusficer.ProductService.service;

import com.Lusficer.ProductService.dto.request.ReviewRequestDTO;
import com.Lusficer.ProductService.dto.response.ReviewResponseDTO;
import com.Lusficer.ProductService.entity.Product;
import com.Lusficer.ProductService.entity.ProductReview;
import com.Lusficer.ProductService.exception.BadRequestException;
import com.Lusficer.ProductService.exception.ResourceNotFoundException;
import com.Lusficer.ProductService.repository.ProductRepository;
import com.Lusficer.ProductService.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    @Transactional
    public ReviewResponseDTO addReview(String productId, String userId, ReviewRequestDTO request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (reviewRepository.existsByUserIdAndOrderIdAndProduct_ProductId(userId, request.getOrderId(), productId)) {
            throw new BadRequestException("You have already reviewed this product for this order.");
        }

        String imagesStr = null;
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            imagesStr = String.join("|", request.getImages());
        }

        ProductReview review = ProductReview.builder()
                .product(product)
                .userId(userId)
                .userName(request.getUserName())
                .orderId(request.getOrderId())
                .rating(request.getRating())
                .comment(request.getComment())
                .images(imagesStr) 
                .build();
        
        ProductReview savedReview = reviewRepository.save(review);

        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        Integer totalReviews = reviewRepository.countReviewsByProductId(productId);

        BigDecimal roundedAvg = BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP);
        
        product.setAverageRating(roundedAvg.doubleValue());
        product.setTotalReviews(totalReviews);
        productRepository.save(product);

        return mapToResponseDTO(savedReview);
    }

    public List<ReviewResponseDTO> getProductReviews(String productId) {
        List<ProductReview> reviews = reviewRepository.findByProduct_ProductIdOrderByCreatedAtDesc(productId);
        return reviews.stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    private ReviewResponseDTO mapToResponseDTO(ProductReview review) {
        List<String> imageList = new ArrayList<>();
        if (review.getImages() != null && !review.getImages().trim().isEmpty()) {
            imageList = Arrays.asList(review.getImages().split("\\|"));
        }

        return ReviewResponseDTO.builder()
                .reviewId(review.getReviewId())
                .userId(review.getUserId())
                .userName(review.getUserName())
                .rating(review.getRating())
                .comment(review.getComment())
                .images(imageList) 
                .createdAt(review.getCreatedAt())
                .build();
    }
}