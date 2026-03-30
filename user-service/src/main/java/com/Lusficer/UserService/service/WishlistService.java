package com.Lusficer.UserService.service;

import com.Lusficer.UserService.entity.Wishlist;
import com.Lusficer.UserService.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {
    
    private final WishlistRepository wishlistRepo;

    /**
     * Retrieves user's wishlist ordered by most recently added.
     */
    public List<Wishlist> getMyWishlist(String userId) {
        return wishlistRepo.findByUserIdOrderByAddedAtDesc(userId);
    }

    /**
     * Checks if a product exists in user's wishlist.
     */
    public boolean checkWishlist(String userId, String productId) {
        return wishlistRepo.existsByUserIdAndProductId(userId, productId);
    }

    /**
     * Toggles product in wishlist.
     * Removes if already exists, adds if not present.
     */
    @Transactional
    public void toggleWishlist(String userId, String productId) {
        wishlistRepo.findByUserIdAndProductId(userId, productId).ifPresentOrElse(
            wishlist -> wishlistRepo.delete(wishlist),
            () -> {
                Wishlist newWishlist = Wishlist.builder()
                        .userId(userId)
                        .productId(productId)
                        .build();
                wishlistRepo.save(newWishlist);
            }
        );
    }
}