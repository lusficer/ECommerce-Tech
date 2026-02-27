package com.Lusficer.CartService.controller;

import com.Lusficer.CartService.dto.request.*;
import com.Lusficer.CartService.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/cart")
@SecurityRequirement(name = "Bearer Token")
@PreAuthorize("hasRole('ROLE_CUSTOMER')")
public class CartController {

    @Autowired private CartService cartService;

    // Xem giỏ hàng
    @GetMapping
    public ResponseEntity<?> getMyCart(@RequestHeader("userId") String userId) {
        return ResponseEntity.ok(cartService.getMyCart(userId));
    }

    // Thêm vào giỏ
    @PostMapping("/add")
    public ResponseEntity<?> addToCart(
            @RequestHeader("userId") String userId,
            @RequestBody AddToCartRequest req) {
        return ResponseEntity.ok(cartService.addToCart(userId, req));
    }

    // Cập nhật số lượng
    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateItem(
            @RequestHeader("userId") String userId,
            @PathVariable("itemId") Long itemId,
            @RequestBody UpdateItemRequest req) {
        return ResponseEntity.ok(cartService.updateQuantity(userId, itemId, req.getQuantity()));
    }
    
    // API Nội bộ cho Order Service gọi để xóa giỏ
    @DeleteMapping("/internal/clear")
    public ResponseEntity<?> clearCartInternal(@RequestParam("userId") String userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok("Cart cleared");
    }
}