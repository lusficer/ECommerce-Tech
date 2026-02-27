// File: OrderRepository.java
package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    // Cho User xem lịch sử
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    // Cho Vendor xem đơn hàng của Shop mình
    List<Order> findByShopIdOrderByCreatedAtDesc(String shopId);
    
    // Cho Vendor lọc theo trạng thái
    List<Order> findByShopIdAndOrderStatus(String shopId, OrderStatus status);

    // Cho Manager xem đơn cần duyệt
    List<Order> findByOrderStatus(OrderStatus status);

    // 5. [MỚI] Dùng cho Scheduler: Tìm đơn hàng DELIVERED đã lâu để tự động COMPLETED
    // "UpdatedAtBefore" nghĩa là thời gian cập nhật < thời điểm truyền vào (quá khứ)
    List<Order> findByOrderStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime dateTime);
}