// File: OrderTrackingRepository.java
package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {
    List<OrderTracking> findByOrder_OrderIdOrderByUpdatedAtDesc(String orderId);
}