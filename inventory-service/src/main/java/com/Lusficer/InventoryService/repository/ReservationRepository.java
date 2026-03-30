package com.Lusficer.InventoryService.repository;

import com.Lusficer.InventoryService.entity.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservationRepository extends JpaRepository<InventoryReservation, Long> {
    
    /**
     * Returns all reservations for an order.
     */
    List<InventoryReservation> findByOrderId(String orderId);
    
    /**
     * Returns reservations that have expired.
     */
    List<InventoryReservation> findByExpiryTimeBefore(java.time.LocalDateTime now);
}