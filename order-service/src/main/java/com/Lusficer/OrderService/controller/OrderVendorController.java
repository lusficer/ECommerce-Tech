package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.client.ShopClient;
import com.Lusficer.OrderService.dto.request.UpdateStatusRequest;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.exception.UnauthorizedAccessException;
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
@PreAuthorize("hasRole('ROLE_VENDOR')")
public class OrderVendorController {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ShopClient shopClient;

    /**
     * Returns orders for a shop after verifying vendor access.
     */
    @GetMapping("/{shopId}")
    @Operation(summary = "Get orders for a specific shop")
    public ResponseEntity<List<Order>> getShopOrders(
            @RequestHeader("Vendor_Id") String vendorId, 
            @PathVariable("shopId") String shopId,
            @RequestParam(name = "status", required = false) String status){
        boolean isAssigned = shopClient.checkVendorAccess(shopId, vendorId);
        if (!isAssigned) {
            throw new UnauthorizedAccessException("You do not have permission to view orders for this shop.");
        }
        
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(
                orderRepository.findByShopIdAndOrderStatus(shopId, OrderStatus.valueOf(status))
            );
        }
        return ResponseEntity.ok(orderRepository.findByShopIdOrderByCreatedAtDesc(shopId));
    }

    /**
     * Updates order status after verifying vendor access.
     */
    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update order status (e.g., PROCESSING, READY_TO_SHIP)")
    public ResponseEntity<Order> updateStatus(
            @RequestHeader("Vendor_Id") String vendorId,
            @PathVariable("orderId") String orderId,
            @RequestBody UpdateStatusRequest request) {
        
        boolean isAssigned = shopClient.checkVendorAccess(request.getShopId(), vendorId);
        if (!isAssigned) {
            throw new UnauthorizedAccessException("You do not have permission to update orders for this shop.");
        }

        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request));
    }
}