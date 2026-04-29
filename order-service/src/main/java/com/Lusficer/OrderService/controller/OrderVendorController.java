package com.Lusficer.OrderService.controller;

import com.Lusficer.OrderService.dto.request.AssignShipperRequest;
import com.Lusficer.OrderService.dto.request.UpdateStatusRequest;
import com.Lusficer.OrderService.dto.response.ShipperWithStatusDTO;
import com.Lusficer.OrderService.dto.response.ShippingPhotoDTO;
import com.Lusficer.OrderService.dto.response.ShippingResponseDTO;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.service.OrderService;
import com.Lusficer.OrderService.service.ShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor/orders")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Vendor Order", description = "Order management for Vendors")
@PreAuthorize("hasRole('ROLE_VENDOR')")
public class OrderVendorController {

    @Autowired private OrderService orderService;
    @Autowired private ShippingService shippingService;

    @GetMapping
    @Operation(summary = "Get all orders across all shops of this vendor")
    public ResponseEntity<List<Order>> getAllVendorOrders(
            Authentication authentication,
            @RequestParam(name = "status", required = false) String status) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrdersByVendor(vendorId, status));
    }

    @GetMapping("/shop/{shopId}")
    @Operation(summary = "Get orders for a specific shop")
    public ResponseEntity<List<Order>> getShopOrders(
            Authentication authentication,
            @PathVariable("shopId") String shopId,
            @RequestParam(name = "status", required = false) String status) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrdersByShopForVendor(vendorId, shopId, status));
    }

    @GetMapping("/{orderId}/shipping-info")
    @Operation(summary = "Get order detail with shipper info")
    public ResponseEntity<?> getOrderShippingInfo(
            Authentication authentication,
            @PathVariable("orderId") String orderId) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderShippingInfoForVendor(vendorId, orderId));
    }

    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update order status")
    public ResponseEntity<Order> updateStatus(
            Authentication authentication,
            @PathVariable("orderId") String orderId,
            @RequestBody UpdateStatusRequest request) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.updateOrderStatusForVendor(vendorId, orderId, request));
    }

    @GetMapping("/shippers/available")
    @Operation(summary = "Get list of available shippers")
    public ResponseEntity<List<ShipperWithStatusDTO>> getAvailableShippers(
            Authentication authentication) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getAvailableShippers(vendorId));
    }

    @PostMapping("/{orderId}/assign-shipper")
    @Operation(summary = "Assign a shipper to an order")
    public ResponseEntity<ShippingResponseDTO> assignShipper(
            Authentication authentication,
            @PathVariable("orderId") String orderId,
            @RequestBody AssignShipperRequest request) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.assignShipperToOrder(vendorId, orderId, request.getShipperId()));
    }

    @GetMapping("/{orderId}/photos")
    @Operation(summary = "Get all delivery photos for an order")
    public ResponseEntity<List<ShippingPhotoDTO>> getOrderPhotos(
            Authentication authentication,
            @PathVariable("orderId") String orderId) {
        String vendorId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(shippingService.getPhotosByOrderForVendor(vendorId, orderId));
    }
}