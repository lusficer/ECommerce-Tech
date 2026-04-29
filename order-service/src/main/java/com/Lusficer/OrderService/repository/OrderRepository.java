package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    /**
     * Finds orders for a user ordered by creation time (newest first).
     */
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Finds orders for a shop ordered by creation time (newest first).
     */
    List<Order> findByShopIdOrderByCreatedAtDesc(String shopId);
    
    /**
     * Finds orders for a shop with a specific status.
     */
    List<Order> findByShopIdAndOrderStatus(String shopId, OrderStatus status);

    /**
     * Finds orders by status.
     */
    List<Order> findByOrderStatus(OrderStatus status);

    /**
     * Finds orders by status that were last updated before the given time.
     */
    List<Order> findByOrderStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime dateTime);

    /**
     * Finds orders by status that have not yet been assigned to a shipper.
     */
    List<Order> findByOrderStatusAndShipperIdIsNull(OrderStatus status);

    /**
     * Finds orders assigned to a shipper with a specific status.
     */
    List<Order> findByShipperIdAndOrderStatus(String shipperId, OrderStatus status);

    /**
     * Counts user orders created after a given time.
     */
    long countByUserIdAndCreatedAtAfter(String userId, LocalDateTime createdAfter);

    /**
     * Counts user orders with a specific status updated after a given time.
     */
    long countByUserIdAndOrderStatusAndUpdatedAtAfter(String userId, OrderStatus status, LocalDateTime updatedAfter);

    /**
     * Returns the most recent order (excluding a given orderId) for address comparison.
     */
    Order findTopByUserIdAndOrderIdNotOrderByCreatedAtDesc(String userId, String orderId);

    List<Order> findByShopIdInOrderByCreatedAtDesc(List<String> shopIds);
    List<Order> findByShopIdInAndOrderStatus(List<String> shopIds, OrderStatus status);
}