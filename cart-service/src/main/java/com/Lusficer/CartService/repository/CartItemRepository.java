package com.Lusficer.CartService.repository;

import com.Lusficer.CartService.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import org.springframework.data.repository.query.Param;
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    Optional<CartItem> findByCart_CartIdAndProductId(Long cartId, String productId);

   @Modifying
    @Query("DELETE FROM CartItem c WHERE c.cart.cartId = :cartId")
    void deleteAllByCartId(@Param("cartId") Long cartId);
}