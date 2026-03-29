package com.Lusficer.ProductService.repository;

import com.Lusficer.ProductService.entity.ApprovalStatus;
import com.Lusficer.ProductService.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    
    List<Product> findByShopIdAndIsDeletedFalse(String shopId);

    
    List<Product> findByShopIdAndApprovalStatusOrderBySubmittedAtAsc(String shopId, ApprovalStatus status);

    List<Product> findByProductIdIn(List<String> productIds);

    List<Product> findTop10ByApprovalStatusOrderBySubmittedAtDesc(ApprovalStatus status);

    List<Product> findByShopIdAndApprovalStatusAndIsDeletedFalse(String shopId, ApprovalStatus status);

    List<Product> findTop10ByApprovalStatusAndIsDeletedFalseOrderBySoldCountDesc(ApprovalStatus status);

    List<Product> findByNameContainingIgnoreCaseAndApprovalStatusAndIsDeletedFalse(
              String keyword, 
              ApprovalStatus status);    
    @Query("SELECT p FROM Product p WHERE p.isDeleted = false " +
           "AND p.approvalStatus = 'APPROVED' " +
           "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:categoryId IS NULL OR p.categoryId = :categoryId) " +
           "AND (:brand IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :brand, '%'))) " +
           "AND (:minPrice IS NULL OR (p.price * (1.0 - (COALESCE(p.discountPercentage, 0) / 100.0))) >= :minPrice) " +
           "AND (:maxPrice IS NULL OR (p.price * (1.0 - (COALESCE(p.discountPercentage, 0) / 100.0))) <= :maxPrice)")
    org.springframework.data.domain.Page<Product> filterProducts(
                                 @Param("keyword") String keyword,
                                 @Param("categoryId") String categoryId,
                                 @Param("brand") String brand, 
                                 @Param("minPrice") java.math.BigDecimal minPrice,
                                 @Param("maxPrice") java.math.BigDecimal maxPrice,
                                 org.springframework.data.domain.Pageable pageable);
}