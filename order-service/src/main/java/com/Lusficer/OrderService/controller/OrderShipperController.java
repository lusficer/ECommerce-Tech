package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.ShippingRequestDTO;
import com.Lusficer.OrderService.dto.response.ShippingResponseDTO;
import com.Lusficer.OrderService.service.ShippingService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.Lusficer.OrderService.entity.Order;
import java.util.List;
@RestController
@RequestMapping("/api/shipper/orders")
@SecurityRequirement(name = "Bearer Token") 
@Tag(name = "Shipper Order", description = "Order operations for Shipper")
@PreAuthorize("hasRole('ROLE_SHIPPER')")
@RequiredArgsConstructor
public class OrderShipperController {

    private final ShippingService shippingService;

    /**
     * API cập nhật trạng thái vận chuyển của Shipper
     * Request body mong đợi: { "status": "DELIVERED", "note": "Giao giờ hành chính" }
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<ShippingResponseDTO> updateOrderStatusByShipper(
            @PathVariable("orderId") String orderId,
            @RequestHeader(value = "userId", required = false, defaultValue = "SHIPPER_001") String shipperId, 
            @RequestBody ShippingRequestDTO request) {
        
        // Gán orderId từ PathVariable vào request để đảm bảo an toàn dữ liệu
        request.setOrderId(orderId);
        
        ShippingResponseDTO updatedShipping = shippingService.updateShippingStatus(shipperId, request);
        return ResponseEntity.ok(updatedShipping);
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<Order>> getAvailableOrders() {
        return ResponseEntity.ok(shippingService.getAvailableOrders());
    }

    // Lấy danh sách đơn hàng mà Shipper này ĐÃ NHẬN
    @GetMapping("/my-deliveries")
    public ResponseEntity<List<Order>> getMyDeliveries(
            @RequestHeader(value = "userId") String shipperId,
            @RequestParam(value = "status", defaultValue = "SHIPPING") String status) {
        return ResponseEntity.ok(shippingService.getMyAssignedOrders(shipperId, status));
    }

    // API để Shipper bấm "Nhận đơn hàng này"
    @PutMapping("/{orderId}/accept")
    public ResponseEntity<String> acceptOrder(
            @PathVariable("orderId") String orderId,
            @RequestHeader(value = "userId") String shipperId) {
        
        shippingService.acceptOrder(orderId, shipperId);
        return ResponseEntity.ok("The order has been accepted successfully!");
    }
}