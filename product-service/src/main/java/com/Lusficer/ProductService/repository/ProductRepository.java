package com.Lusficer.ProductService.repository;

import com.Lusficer.ProductService.entity.ApprovalStatus;
import com.Lusficer.ProductService.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    
    // Các hàm cũ của bạn (giữ nguyên)
    List<Product> findByShopIdAndIsDeletedFalse(String shopId);
    List<Product> findByApprovalStatusOrderBySubmittedAtAsc(ApprovalStatus status);

    // --- [MỚI] Dành cho Internal API ---
    
    // 1. Tìm nhiều sản phẩm theo danh sách ID (Batch)
    List<Product> findByProductIdIn(List<String> productIds);

    // 2. Tìm 10 sản phẩm ĐÃ DUYỆT mới nhất (Trending Fallback)
    // Sắp xếp theo ngày nộp (submittedAt) giảm dần
    List<Product> findTop10ByApprovalStatusOrderBySubmittedAtDesc(ApprovalStatus status);

    List<Product> findByNameContainingIgnoreCaseAndIsDeletedFalse(String keyword);
}