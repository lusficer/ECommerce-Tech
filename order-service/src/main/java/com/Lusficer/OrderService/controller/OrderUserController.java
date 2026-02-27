package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.PlaceOrderRequest;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.entity.OrderTracking;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.repository.OrderTrackingRepository;
import com.Lusficer.OrderService.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/orders")
@SecurityRequirement(name = "Bearer Token") // Bật khóa trên Swagger
@Tag(name = "User Order", description = "Order operations for Customers")
@PreAuthorize("hasRole('ROLE_CUSTOMER')") // Chỉ Customer mới gọi được
public class OrderUserController {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderTrackingRepository trackingRepository;

    // UC: Place Order
    @PostMapping("/place")
    @Operation(summary = "Place a new order")
    public ResponseEntity<Order> placeOrder(
            @RequestHeader("userId") String userId, // Lấy ID từ Token/Header an toàn
            @RequestBody PlaceOrderRequest request) {
        
        // Gán userId từ Header vào Request để đảm bảo chính chủ
        request.setUserId(userId);
        return ResponseEntity.ok(orderService.placeOrder(request));
    }

    // UC: Cancel Order
    @PutMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<String> cancelOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        orderService.cancelOrder(orderId, userId);
        return ResponseEntity.ok("Order cancelled successfully");
    }

    // UC: View History
    @GetMapping("/history")
    @Operation(summary = "View order history")
    public ResponseEntity<List<Order>> getHistory(
            @RequestHeader("userId") String userId) {
        
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    // UC: Track Order
    @GetMapping("/{orderId}/track")
    @Operation(summary = "Track shipment status")
    public ResponseEntity<List<OrderTracking>> trackOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        // Cần check xem user này có sở hữu đơn hàng này không (logic check owner)
        // Tạm thời trả về list
        return ResponseEntity.ok(trackingRepository.findByOrder_OrderIdOrderByUpdatedAtDesc(orderId));
    }

    // API: User xác nhận đã nhận hàng thành công
    @PutMapping("/{orderId}/complete")
    @Operation(summary = "User confirms receipt of goods")
    public ResponseEntity<Order> completeOrder(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable("orderId") String orderId) {
        
        return ResponseEntity.ok(orderService.completeOrder(orderId, userId));
    }
}