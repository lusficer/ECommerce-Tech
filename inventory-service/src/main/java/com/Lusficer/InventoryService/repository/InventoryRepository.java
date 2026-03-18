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
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId = :productId")
    Optional<Inventory> findByProductIdLocked(@Param("productId") String productId);

    Optional<Inventory> findByProductId(String productId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Inventory> findByProductIdIn(List<String> productIds);
}