package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.Shipping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShippingRepository extends JpaRepository<Shipping, Long> {

    /**
     * Finds shipping details by order ID.
     */
    Optional<Shipping> findByOrderId(String orderId);

    /**
     * Finds shipments assigned to a specific shipper ordered by creation time.
     */
    List<Shipping> findByShipperIdOrderByCreatedAtDesc(String shipperId);
}