package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.ShippingRequestDTO;
import com.Lusficer.OrderService.dto.request.UpdateShipperStatusRequest;
import com.Lusficer.OrderService.dto.response.ShipperAvailableOrderDTO;
import com.Lusficer.OrderService.dto.response.ShippingResponseDTO;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.entity.ShipperStatus;
import com.Lusficer.OrderService.enums.ShippingStatus;
import com.Lusficer.OrderService.service.ShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.Lusficer.OrderService.enums.ShippingStatus;
import org.springframework.web.multipart.MultipartFile;
import com.Lusficer.OrderService.dto.response.ShippingPhotoDTO;
import java.util.List;

@RestController
@RequestMapping("/api/shipper/orders")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Shipper Order", description = "Order operations for Shipper")
@PreAuthorize("hasRole('ROLE_SHIPPER')")
@RequiredArgsConstructor
public class OrderShipperController {

    private final ShippingService shippingService;

    // Xem status của bản thân
    @GetMapping("/status")
    @Operation(summary = "Get my current status")
    public ResponseEntity<ShipperStatus> getMyStatus(Authentication authentication) {
        String shipperId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(shippingService.getShipperStatus(shipperId));
    }

    // Tự update status
    @PutMapping("/status")
    @Operation(summary = "Update my status (AVAILABLE, UNAVAILABLE, ON_DELIVERY)")
    public ResponseEntity<ShipperStatus> updateMyStatus(
            Authentication authentication,
            @RequestBody UpdateShipperStatusRequest request) {
        String shipperId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(shippingService.updateShipperStatus(shipperId, request));
    }

    // Update shipping status của đơn — lấy shipperId từ JWT
    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update shipping status for an order")
    public ResponseEntity<ShippingResponseDTO> updateOrderStatusByShipper(
            Authentication authentication,
            @PathVariable("orderId") String orderId,
            @RequestBody ShippingRequestDTO request) {
        String shipperId = (String) authentication.getPrincipal();
        request.setOrderId(orderId);
        return ResponseEntity.ok(shippingService.updateShippingStatus(shipperId, request));
    }

    // Xem đơn available để nhận
    @GetMapping("/available")
    @Operation(summary = "Get available orders for pickup")
    public ResponseEntity<List<ShipperAvailableOrderDTO>> getAvailableOrders() {
        return ResponseEntity.ok(shippingService.getAvailableOrdersWithPickupInfo());
    }

    // Xem đơn đang giao của mình
    @GetMapping("/my-deliveries")
    @Operation(summary = "Get my assigned orders")
    public ResponseEntity<List<Order>> getMyDeliveries(
            Authentication authentication,
            @RequestParam(value = "status", defaultValue = "SHIPPING") String status) {
        String shipperId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(shippingService.getMyAssignedOrders(shipperId, status));
    }

    @PostMapping(value = "/{orderId}/photos", consumes = "multipart/form-data")
    @Operation(summary = "Upload delivery photo for an order")
    public ResponseEntity<ShippingPhotoDTO> uploadPhoto(
            Authentication authentication,
            @PathVariable("orderId") String orderId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("photoType") ShippingStatus photoType) {
        String shipperId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(shippingService.uploadPhoto(shipperId, orderId, file, photoType));
    }

    // Nhận đơn
    @PutMapping("/{orderId}/accept")
    @Operation(summary = "Accept an available order")
    public ResponseEntity<String> acceptOrder(
            Authentication authentication,
            @PathVariable("orderId") String orderId) {
        String shipperId = (String) authentication.getPrincipal();
        shippingService.acceptOrder(orderId, shipperId);
        return ResponseEntity.ok("Order accepted successfully!");
    }
}