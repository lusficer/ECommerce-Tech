package com.Lusficer.CartService.service;

import com.Lusficer.CartService.client.*;
import com.Lusficer.CartService.dto.request.*;
import com.Lusficer.CartService.dto.response.*;
import com.Lusficer.CartService.entity.*;
import com.Lusficer.CartService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartService {

    @Autowired private CartRepository cartRepo;
    @Autowired private CartItemRepository itemRepo;
    @Autowired private ProductClient productClient;
    @Autowired private InventoryClient inventoryClient;
    
    /**
     * Retrieves cart for specified user.
     */
    public CartResponse getMyCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToResponse(cart);
    }

    /**
     * Adds product to cart with inventory validation.
     * Updates quantity if product already exists in cart.
     */
    @Transactional
    public CartResponse addToCart(String userId, AddToCartRequest req) {
        var product = productClient.getProductDetail(req.getProductId());
        if (product == null) throw new RuntimeException("Product not found");

        Integer availableStock = 0;
        try {
            availableStock = inventoryClient.getAvailableStock(req.getProductId());
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }

        if (availableStock == null || availableStock < req.getQuantity()) {
            int remaining = (availableStock == null ? 0 : availableStock);
            throw new RuntimeException("This product has only " + remaining + " left in stock.");
        }

        Cart cart = getOrCreateCart(userId);

        Integer discount = product.getDiscountPercentage() != null ? product.getDiscountPercentage() : 0;
        BigDecimal originalPrice = product.getPrice();
        BigDecimal salePrice = originalPrice;
        
        if (discount > 0) {
            salePrice = originalPrice.multiply(BigDecimal.valueOf(100 - discount))
                                     .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        CartItem item = itemRepo.findByCart_CartIdAndProductId(cart.getCartId(), req.getProductId())
                .orElse(null);

        if (item != null) {
            int totalNewQty = item.getQuantity() + req.getQuantity();
              if (totalNewQty > availableStock) {
                  throw new RuntimeException("You already have " + item.getQuantity() + " in your cart. Stock has only " + availableStock + " total.");
              }
            
            item.setQuantity(totalNewQty);
            item.setUnitPrice(salePrice); 
            item.setDiscountPercentage(discount);
            item.setSubTotal(salePrice.multiply(BigDecimal.valueOf(totalNewQty)));
        } else {
            String thumbnail = product.getMainImage();
            if (thumbnail != null && thumbnail.contains("|")) {
                thumbnail = thumbnail.split("\\|")[0];
            }

            
            item = CartItem.builder()
                    .cart(cart)
                    .productId(product.getProductId())
                    .shopId(product.getShopId())
                    .productName(product.getName())
                    .productImage(thumbnail) 
                    .quantity(req.getQuantity())
                    .unitPrice(salePrice) 
                    .discountPercentage(discount) 
                    .subTotal(salePrice.multiply(BigDecimal.valueOf(req.getQuantity())))
                    .build();
        }
        itemRepo.save(item);
        
        if (cart.getItems() == null) cart.setItems(new ArrayList<>());
        if (!cart.getItems().contains(item)) {
            cart.getItems().add(item);
        }

        updateCartTotal(cart);
        
        return mapToResponse(cart);
    }

    /**
     * Updates item quantity in cart.
     * Removes item if quantity is zero or negative.
     */
    @Transactional
    public CartResponse updateQuantity(String userId, Long itemId, Integer newQuantity) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        if (!item.getCart().getCartId().equals(cart.getCartId())) {
             throw new RuntimeException("Unauthorized item access");
        }

        if (newQuantity <= 0) {
            cart.getItems().removeIf(i -> i.getItemId().equals(itemId)); 
            
            itemRepo.delete(item); 
        } else {
            item.setQuantity(newQuantity);
            item.setSubTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
            itemRepo.save(item);
        }

        updateCartTotal(cart);
        return mapToResponse(cart);
    }
    
    /**
     * Removes single item from cart.
     */
    @Transactional
    public void removeItem(String userId, Long itemId) {
        updateQuantity(userId, itemId, 0);
    }

    /**
     * Clears all items from user's cart.
     */
    @Transactional
    public void clearCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear(); 
        
        itemRepo.deleteAllByCartId(cart.getCartId());
        
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepo.save(cart);
    }

    /**
     * Removes multiple items from cart by item IDs.
     */
    @Transactional
    public CartResponse removeItems(String userId, List<Long> itemIds) {
        Cart cart = getOrCreateCart(userId);
        
        List<CartItem> itemsToRemove = cart.getItems().stream()
                .filter(item -> itemIds.contains(item.getItemId()))
                .collect(Collectors.toList());

        if (!itemsToRemove.isEmpty()) {
            cart.getItems().removeAll(itemsToRemove);
            itemRepo.deleteAll(itemsToRemove); 
            updateCartTotal(cart); 
        }
        
        return mapToResponse(cart);
    }


    /**
     * Retrieves existing cart for user or creates new empty cart.
     */
    private Cart getOrCreateCart(String userId) {
        return cartRepo.findByUserId(userId)
                .orElseGet(() -> {
                    Cart c = new Cart();
                    c.setUserId(userId);
                    c.setTotalPrice(BigDecimal.ZERO);
                    return cartRepo.save(c);
                });
    }

    /**
     * Recalculates and updates cart total price based on all items.
     */
    private void updateCartTotal(Cart cart) {
        BigDecimal total = cart.getItems().stream()
                .map(CartItem::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        cart.setTotalPrice(total);
        cartRepo.save(cart);
    }

    /**
     * Maps cart entity to response DTO with calculated totals.
     */
    private CartResponse mapToResponse(Cart cart) {
        int totalItems = (cart.getItems() == null) ? 0 : 
                cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
        return CartResponse.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUserId())
                .totalItems(totalItems)
                .totalPrice(cart.getTotalPrice())
                .items(cart.getItems().stream().map(this::mapItemToResponse).collect(Collectors.toList()))
                .build();
    }

    /**
     * Maps cart item entity to response DTO.
     */
    private CartItemResponse mapItemToResponse(CartItem item) {
        return CartItemResponse.builder()
                .itemId(item.getItemId())
                .productId(item.getProductId())       
                .shopId(item.getShopId())             
                .productName(item.getProductName())
                .productImage(item.getProductImage()) 
                .unitPrice(item.getUnitPrice())       
                .quantity(item.getQuantity())         
                .subTotal(item.getSubTotal())  
                .discountPercentage(item.getDiscountPercentage())
                .build();
    }
}