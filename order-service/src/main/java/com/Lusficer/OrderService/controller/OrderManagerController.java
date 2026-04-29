package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.VerifyOrderRequest;
import com.Lusficer.OrderService.dto.response.VerificationContextDTO;
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
@PreAuthorize("hasRole('ROLE_SHOP_MANAGER')") 
public class OrderManagerController {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;

    /**
     * Returns all orders for a shop.
     */
    @GetMapping("/shop/{shopId}/all")
    @Operation(summary = "Get all orders of the shop")
    public ResponseEntity<List<Order>> getAllShopOrders(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(orderRepository.findByShopIdOrderByCreatedAtDesc(shopId));
    }

    /**
     * Returns orders pending verification for a shop.
     */
    @GetMapping("/shop/{shopId}/pending-verification")
    @Operation(summary = "Get all orders pending verification for a specific shop")
    public ResponseEntity<List<Order>> getPendingVerificationOrders(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(orderRepository.findByShopIdAndOrderStatus(shopId, OrderStatus.PENDING_VERIFICATION));
    }

    /**
     * Returns orders currently in shipping status for a shop.
     */
    @GetMapping("/shop/{shopId}/shipping")
    @Operation(summary = "Monitor ongoing shipments for a specific shop")
    public ResponseEntity<List<Order>> getShippingOrders(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(orderRepository.findByShopIdAndOrderStatus(shopId, OrderStatus.SHIPPING));
    }

    /**
     * Approves or rejects an order awaiting verification.
     */
    @PutMapping("/{orderId}/verify")
    @Operation(summary = "Approve or Reject an order")
    public ResponseEntity<Order> verifyOrder(
            @RequestHeader("managerId") String managerId,
            @PathVariable("orderId") String orderId,
            @RequestBody VerifyOrderRequest request) {
        
        request.setManagerId(managerId);
        return ResponseEntity.ok(orderService.verifyOrder(orderId, request));
    }

    /**
     * Returns verification context (payment + fraud signals) to support manager decisions.
     */
    @GetMapping("/{orderId}/verification-context")
    @Operation(summary = "Get verification context for an order")
    public ResponseEntity<VerificationContextDTO> getVerificationContext(@PathVariable("orderId") String orderId) {
        return ResponseEntity.ok(orderService.getVerificationContext(orderId));
    }
}