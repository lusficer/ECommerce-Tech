package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.Shipping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShippingRepository extends JpaRepository<Shipping, Long> {

    // Tìm thông tin vận chuyển dựa vào mã Đơn hàng
    Optional<Shipping> findByOrderId(String orderId);

    // Tìm tất cả các đơn hàng mà một Shipper cụ thể đang phụ trách
    List<Shipping> findByShipperIdOrderByCreatedAtDesc(String shipperId);
}