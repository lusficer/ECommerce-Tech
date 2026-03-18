package com.Lusficer.ProductService.repository;

import com.Lusficer.ProductService.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    
    List<ProductReview> findByProduct_ProductIdOrderByCreatedAtDesc(String productId);

    boolean existsByUserIdAndOrderIdAndProduct_ProductId(String userId, String orderId, String productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM ProductReview r WHERE r.product.productId = :productId")
    Double getAverageRatingByProductId(@Param("productId") String productId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.productId = :productId")
    Integer countReviewsByProductId(@Param("productId") String productId);
}