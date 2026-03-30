package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Order> findByShopIdOrderByCreatedAtDesc(String shopId);
    
    List<Order> findByShopIdAndOrderStatus(String shopId, OrderStatus status);

    List<Order> findByOrderStatus(OrderStatus status);

    List<Order> findByOrderStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime dateTime);

    List<Order> findByOrderStatusAndShipperIdIsNull(OrderStatus status);

    List<Order> findByShipperIdAndOrderStatus(String shipperId, OrderStatus status);
}