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

    public List<Wishlist> getMyWishlist(String userId) {
        return wishlistRepo.findByUserIdOrderByAddedAtDesc(userId);
    }

    public boolean checkWishlist(String userId, String productId) {
        return wishlistRepo.existsByUserIdAndProductId(userId, productId);
    }

    @Transactional
    public void toggleWishlist(String userId, String productId) {
        // If already liked, unlike; if not liked, add to wishlist
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