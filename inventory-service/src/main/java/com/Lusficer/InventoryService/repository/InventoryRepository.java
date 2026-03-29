package com.Lusficer.InventoryService.repository;

import com.Lusficer.InventoryService.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    // Pessimistic lock — dùng khi RESERVE/CONFIRM_SALE để tránh race condition
    // khi nhiều người cùng mua cùng lúc
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId = :productId")
    Optional<Inventory> findByProductIdLocked(@Param("productId") String productId);

    // Read-only, không lock — dùng cho display (product detail, cart preview...)
    Optional<Inventory> findByProductId(String productId);

    // Read-only batch — dùng trong StockForecastService (không cần lock vì chỉ đọc)
    @Query("SELECT i FROM Inventory i WHERE i.productId IN :productIds")
    List<Inventory> findByProductIdInReadOnly(@Param("productIds") List<String> productIds);

    // Locked batch — dùng khi cần lock nhiều sản phẩm cùng lúc (ví dụ: batch reserve)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId IN :productIds ORDER BY i.productId")
    List<Inventory> findByProductIdIn(List<String> productIds);
}