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

    /**
     * Pessimistic lock for reserve/confirm operations to avoid race conditions.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId = :productId")
    Optional<Inventory> findByProductIdLocked(@Param("productId") String productId);

    /**
     * Read-only lookup without locking for display use cases.
     */
    Optional<Inventory> findByProductId(String productId);

    /**
     * Read-only batch lookup for forecasting (no lock needed).
     */
    @Query("SELECT i FROM Inventory i WHERE i.productId IN :productIds")
    List<Inventory> findByProductIdInReadOnly(@Param("productIds") List<String> productIds);

    /**
     * Locked batch lookup when locking multiple products at once is required.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId IN :productIds ORDER BY i.productId")
    List<Inventory> findByProductIdIn(@Param("productIds") List<String> productIds);
}