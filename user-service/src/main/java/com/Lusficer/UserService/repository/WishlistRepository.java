package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, String> {
    List<Wishlist> findByUserIdOrderByAddedAtDesc(String userId);
    boolean existsByUserIdAndProductId(String userId, String productId);
    Optional<Wishlist> findByUserIdAndProductId(String userId, String productId);
    void deleteByUserIdAndProductId(String userId, String productId);
}