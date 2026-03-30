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

        /**
         * Places a new order and optionally generates a payment URL.
         */
    @PostMapping("/place")
        @SecurityRequirement(name = "Bearer Token")
        @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Operation(summary = "Place a new order")
    public ResponseEntity<Map<String, Object>> placeOrder(
            @RequestHeader("userId") String userId,
            @RequestBody PlaceOrderRequest request,
            HttpServletRequest httpRequest) {
        request.setUserId(userId);
        return ResponseEntity.ok(orderService.placeOrder(request, httpRequest));
    }

        /**
         * Cancels an order owned by the current user.
         */
    @PutMapping("/{orderId}/cancel")
        @SecurityRequirement(name = "Bearer Token")
        @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<String> cancelOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        orderService.cancelOrder(orderId, userId);
        return ResponseEntity.ok("Order cancelled successfully");
    }

    /**
     * Returns the current user's order history.
     */
    @GetMapping("/history")
    @SecurityRequirement(name = "Bearer Token")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Operation(summary = "View order history")
    public ResponseEntity<List<Order>> getHistory(
            @RequestHeader("userId") String userId) {
        
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    /**
     * Returns tracking entries for a specific order.
     */
    @GetMapping("/{orderId}/track")
    @SecurityRequirement(name = "Bearer Token")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Operation(summary = "Track shipment status")
    public ResponseEntity<List<OrderTracking>> trackOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        // TODO: Enforce order ownership before returning tracking data.
        return ResponseEntity.ok(trackingRepository.findByOrder_OrderIdOrderByUpdatedAtDesc(orderId));
    }

    /**
     * Handles VNPay return redirect and forwards the user to the frontend.
     */
    @GetMapping("/vnpay-return")
    public void vnpayReturn(@RequestParam Map<String, String> queryParams, HttpServletResponse response) throws Exception {
        String orderId = queryParams.get("vnp_TxnRef");
        
        String result = orderService.processVNPayReturn(queryParams);

        if ("success".equals(result)) {
            response.sendRedirect(frontendUrl + "/" + orderId + "?payment=success");
        } else {
            response.sendRedirect(frontendUrl + "/" + orderId + "?payment=failed");
        }
    }

    /**
     * Confirms that the user has received the order.
     */
    @PutMapping("/{orderId}/complete")
    @SecurityRequirement(name = "Bearer Token")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Operation(summary = "User confirms receipt of goods")
    public ResponseEntity<Order> completeOrder(
            @RequestHeader("userId") String userId,
            @PathVariable("orderId") String orderId) {
        
        return ResponseEntity.ok(orderService.completeOrder(orderId, userId));
    }
}