package com.Lusficer.StatisticsService.repository;

import com.Lusficer.StatisticsService.entity.ProductSalesStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductSalesRepository extends JpaRepository<ProductSalesStats, Long> {
    
    Optional<ProductSalesStats> findByProductId(String productId);

    // [VENDOR] Top sản phẩm bán chạy nhất của Shop
    List<ProductSalesStats> findTop10ByShopIdOrderByTotalSoldDesc(String shopId);
    
    // [MANAGER] Top sản phẩm bán chạy toàn sàn
    List<ProductSalesStats> findTop10ByOrderByTotalRevenueDesc();
}