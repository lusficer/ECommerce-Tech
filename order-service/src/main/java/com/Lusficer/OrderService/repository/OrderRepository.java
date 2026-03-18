// File: OrderRepository.java
package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    // Cho Vendor xem đơn hàng của Shop mình
    List<Order> findByShopIdOrderByCreatedAtDesc(String shopId);
    
    // Cho Vendor lọc theo trạng thái
    List<Order> findByShopIdAndOrderStatus(String shopId, OrderStatus status);

    // Cho Manager xem đơn cần duyệt
    List<Order> findByOrderStatus(OrderStatus status);

    // 5. Dùng cho Scheduler: Tìm đơn hàng DELIVERED đã lâu để tự động COMPLETED
    // "UpdatedAtBefore" nghĩa là thời gian cập nhật < thời điểm truyền vào (quá khứ)
    List<Order> findByOrderStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime dateTime);

    // 1. Tìm các đơn hàng đang chờ Shipper nhận (Trạng thái SHIPPING, chưa ai nhận)
    List<Order> findByOrderStatusAndShipperIdIsNull(OrderStatus status);

    // 2. Tìm các đơn hàng mà một Shipper cụ thể đang giữ (Trạng thái tuỳ ý)
    List<Order> findByShipperIdAndOrderStatus(String shipperId, OrderStatus status);
}