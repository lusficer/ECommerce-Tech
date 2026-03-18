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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/user/orders")

@Tag(name = "User Order", description = "Order operations for Customers")
public class OrderUserController {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderTrackingRepository trackingRepository;

    @Value("${vnpay.frontendUrl}") 
    private String frontendUrl;
    // UC: Place Order
    @PostMapping("/place")
    @SecurityRequirement(name = "Bearer Token") // Bật khóa trên Swagger
    @PreAuthorize("hasRole('ROLE_CUSTOMER')") // Chỉ Customer mới gọi được
    @Operation(summary = "Place a new order")
    public ResponseEntity<Map<String, Object>> placeOrder(
            @RequestHeader("userId") String userId, // [ĐÃ THÊM] Bắt userId từ Header
            @RequestBody PlaceOrderRequest request,
            HttpServletRequest httpRequest) {
        request.setUserId(userId);
        return ResponseEntity.ok(orderService.placeOrder(request, httpRequest));
    }

    // UC: Cancel Order
    @PutMapping("/{orderId}/cancel")
    @SecurityRequirement(name = "Bearer Token") // Bật khóa trên Swagger
    @PreAuthorize("hasRole('ROLE_CUSTOMER')") // Chỉ Customer mới gọi được
    @Operation(summary = "Cancel an order")
    public ResponseEntity<String> cancelOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        orderService.cancelOrder(orderId, userId);
        return ResponseEntity.ok("Order cancelled successfully");
    }

    // UC: View History
    @GetMapping("/history")
    @SecurityRequirement(name = "Bearer Token") // Bật khóa trên Swagger
    @PreAuthorize("hasRole('ROLE_CUSTOMER')") // Chỉ Customer mới gọi được
    @Operation(summary = "View order history")
    public ResponseEntity<List<Order>> getHistory(
            @RequestHeader("userId") String userId) {
        
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    // UC: Track Order
    @GetMapping("/{orderId}/track")
    @SecurityRequirement(name = "Bearer Token") // Bật khóa trên Swagger
    @PreAuthorize("hasRole('ROLE_CUSTOMER')") // Chỉ Customer mới gọi được  
    @Operation(summary = "Track shipment status")
    public ResponseEntity<List<OrderTracking>> trackOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        // Cần check xem user này có sở hữu đơn hàng này không (logic check owner)
        // Tạm thời trả về list
        return ResponseEntity.ok(trackingRepository.findByOrder_OrderIdOrderByUpdatedAtDesc(orderId));
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(@RequestParam Map<String, String> queryParams, HttpServletResponse response) throws Exception {
        String orderId = queryParams.get("vnp_TxnRef");
        
        // Gọi Service xử lý lưu DB
        String result = orderService.processVNPayReturn(queryParams);

        // Sau khi xử lý DB xong, Backend dùng lệnh Redirect để đẩy người dùng quay lại Web ReactJS
        if ("success".equals(result)) {
            response.sendRedirect(frontendUrl + "/" + orderId + "?payment=success");
        } else {
            response.sendRedirect(frontendUrl + "/" + orderId + "?payment=failed");
        }
    }

    // API: User xác nhận đã nhận hàng thành công
    @PutMapping("/{orderId}/complete")
    @SecurityRequirement(name = "Bearer Token") // Bật khóa trên Swagger
    @PreAuthorize("hasRole('ROLE_CUSTOMER')") // Chỉ Customer mới gọi được  
    @Operation(summary = "User confirms receipt of goods")
    public ResponseEntity<Order> completeOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        return ResponseEntity.ok(orderService.completeOrder(orderId, userId));
    }
}