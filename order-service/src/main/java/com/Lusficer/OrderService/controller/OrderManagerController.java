package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.VerifyOrderRequest;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.repository.OrderRepository;
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
@RequestMapping("/api/manager/orders")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Manager Order", description = "Order verification and monitoring for Managers")
@PreAuthorize("hasRole('ROLE_SHOP_MANAGER')") // Chỉ Shop Manager mới gọi được
public class OrderManagerController {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;

    // UC: Verify Order (Lấy list cần duyệt)
    @GetMapping("/pending-verification")
    @Operation(summary = "Get all orders pending verification")
    public ResponseEntity<List<Order>> getPendingVerificationOrders(
             @RequestHeader("managerId") String managerId) {
        return ResponseEntity.ok(orderRepository.findByOrderStatus(OrderStatus.PENDING_VERIFICATION));
    }

    // UC: Verify Order (Hành động duyệt)
    @PutMapping("/{orderId}/verify")
    @Operation(summary = "Approve or Reject an order")
    public ResponseEntity<Order> verifyOrder(
            @RequestHeader("managerId") String managerId,
            @PathVariable("orderId") String orderId,
            @RequestBody VerifyOrderRequest request) {
        
        request.setManagerId(managerId);
        return ResponseEntity.ok(orderService.verifyOrder(orderId, request));
    }
    
    // UC: Monitor Shipments
    @GetMapping("/shipping")
    @Operation(summary = "Monitor all ongoing shipments")
    public ResponseEntity<List<Order>> getShippingOrders(
            @RequestHeader("managerId") String managerId) {
        return ResponseEntity.ok(orderRepository.findByOrderStatus(OrderStatus.SHIPPING));
    }
}