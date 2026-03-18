package com.Lusficer.CartService.controller;

import com.Lusficer.CartService.dto.request.*;
import com.Lusficer.CartService.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
@RestController
@RequestMapping("/api/cart")
@SecurityRequirement(name = "Bearer Token")
public class CartController {

    @Autowired private CartService cartService;

    @GetMapping
    public ResponseEntity<?> getMyCart(@RequestHeader("userId") String userId) {
        return ResponseEntity.ok(cartService.getMyCart(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(
            @RequestHeader("userId") String userId,
            @RequestBody AddToCartRequest req) {
        return ResponseEntity.ok(cartService.addToCart(userId, req));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateItem(
            @RequestHeader("userId") String userId,
            @PathVariable("itemId") Long itemId,
            @RequestBody UpdateItemRequest req) {
        return ResponseEntity.ok(cartService.updateQuantity(userId, itemId, req.getQuantity()));
    }
    
    @DeleteMapping("/internal/clear")
    public ResponseEntity<?> clearCartInternal(@RequestParam("userId") String userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok("Cart cleared");
    }

    @DeleteMapping("/items")
    public ResponseEntity<?> removeItems(
            @RequestHeader("userId") String userId,
            @RequestBody List<Long> itemIds) {
        return ResponseEntity.ok(cartService.removeItems(userId, itemIds));
    }
}