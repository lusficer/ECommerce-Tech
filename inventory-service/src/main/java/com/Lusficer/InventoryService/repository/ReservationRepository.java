package com.Lusficer.InventoryService.repository;

import com.Lusficer.InventoryService.entity.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // <--- Nhớ import List

public interface ReservationRepository extends JpaRepository<InventoryReservation, Long> {
    
    // [FIX] Phải trả về List<InventoryReservation>
    List<InventoryReservation> findByOrderId(String orderId);
    
    // Tìm các đơn giữ hàng đã hết hạn
    List<InventoryReservation> findByExpiryTimeBefore(java.time.LocalDateTime now);
}