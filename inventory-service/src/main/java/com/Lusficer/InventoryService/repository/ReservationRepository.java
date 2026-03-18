package com.Lusficer.InventoryService.repository;

import com.Lusficer.InventoryService.entity.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // <--- Remember to import List

public interface ReservationRepository extends JpaRepository<InventoryReservation, Long> {
    
    // [FIX] Must return List<InventoryReservation>
    List<InventoryReservation> findByOrderId(String orderId);
    
    // Find expired stock reservations
    List<InventoryReservation> findByExpiryTimeBefore(java.time.LocalDateTime now);
}