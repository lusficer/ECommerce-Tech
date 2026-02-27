package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.UpdateStatusRequest;
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
@RequestMapping("/api/vendor/orders")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Vendor Order", description = "Order management for Vendors")
@PreAuthorize("hasRole('ROLE_VENDOR')") // Chỉ Vendor mới gọi được
public class OrderVendorController {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;

    // UC: View Received Orders
    @GetMapping("/{shopId}")
    @Operation(summary = "Get orders for a specific shop")
    public ResponseEntity<List<Order>> getShopOrders(
            @RequestHeader("Vendor_Id") String vendorId, // ID người bán đang login
            @PathVariable("shopId") String shopId,
            @RequestParam(name = "status", required = false) String status){
        
        // *Lưu ý: Trong thực tế nên check xem vendorId có sở hữu shopId này không
        
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(
                orderRepository.findByShopIdAndOrderStatus(shopId, OrderStatus.valueOf(status))
            );
        }
        return ResponseEntity.ok(orderRepository.findByShopIdOrderByCreatedAtDesc(shopId));
    }

    // UC: Update Status (Vendor update: Processing, Ready to Ship...)
    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update order status (e.g., PROCESSING, READY_TO_SHIP)")
    public ResponseEntity<Order> updateStatus(
            @RequestHeader("Vendor_Id") String vendorId,
            @PathVariable("orderId") String orderId,
            @RequestBody UpdateStatusRequest request) {
        
        // Đảm bảo request dùng đúng shop của Vendor này
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request));
    }
}