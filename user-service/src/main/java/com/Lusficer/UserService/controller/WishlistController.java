package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.entity.Wishlist;
import com.Lusficer.UserService.service.WishlistService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Manage wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * Returns a user's wishlist.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<Wishlist>> getMyWishlist(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(wishlistService.getMyWishlist(userId));
    }

    /**
     * Checks whether a product is in the user's wishlist.
     */
    @GetMapping("/{userId}/check/{productId}")
    public ResponseEntity<Boolean> checkWishlist(
            @PathVariable("userId") String userId, 
            @PathVariable("productId") String productId) {
        return ResponseEntity.ok(wishlistService.checkWishlist(userId, productId));
    }

    /**
     * Toggles a product in the user's wishlist.
     */
    @PostMapping("/{userId}/{productId}")
    public ResponseEntity<String> toggleWishlist(
            @PathVariable("userId") String userId, 
            @PathVariable("productId") String productId) {
        wishlistService.toggleWishlist(userId, productId);
        return ResponseEntity.ok("Wishlist updated successfully.");
    }
}