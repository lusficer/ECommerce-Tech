package com.Lusficer.ShopService.repository;

import com.Lusficer.ShopService.entity.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShopRepository extends JpaRepository<Shop, String> {
    List<Shop> findByShopNameContainingIgnoreCaseOrShopIdContainingIgnoreCase(String name, String id);
    Shop findByShopId(String shopId);
    List<Shop> findByVendorId(String vendorId);
    List<Shop> findByManagerId(String managerId);
    boolean existsByShopIdAndVendorId(String shopId, String vendorId);
    boolean existsByShopIdAndManagerId(String shopId, String managerId);
    boolean existsByManagerId(String managerId);

    @Query("""
      SELECT s FROM Shop s
      WHERE (:status IS NULL OR s.status = :status)
        AND (:search IS NULL OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :search, '%')))
      ORDER BY s.createdAt DESC
    """)
    Page<Shop> searchShopsForAdmin(
        @Param("status") String status,
        @Param("search") String search,
        Pageable pageable);
}
