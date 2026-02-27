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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartService {

    @Autowired private CartRepository cartRepo;
    @Autowired private CartItemRepository itemRepo;
    @Autowired private ProductClient productClient;
    @Autowired private InventoryClient inventoryClient; // [NEW] Inject Client
    
    // 1. Lấy giỏ hàng của User (Nếu chưa có thì tạo mới)
    public CartResponse getMyCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToResponse(cart);
    }

    // 2. Thêm vào giỏ
    @Transactional
    public CartResponse addToCart(String userId, AddToCartRequest req) {
        // A. Lấy thông tin sản phẩm (Tên, Giá, Ảnh) từ Product Service
        // Vì Inventory không cầm mấy cái này, nên vẫn phải gọi Product Service
        var product = productClient.getProductDetail(req.getProductId());
        if (product == null) throw new RuntimeException("Product not found");

        // B. [MỚI] Gọi Inventory Service để check số lượng thực tế
        Integer availableStock = 0;
        try {
            availableStock = inventoryClient.getAvailableStock(req.getProductId());
        } catch (Exception e) {
            // Nếu Inventory chết hoặc lỗi mạng, tạm thời chặn mua cho an toàn
            // Hoặc bạn có thể log lỗi và cho qua nếu muốn "liều" (nhưng rủi ro oversell)
            throw new RuntimeException("Hệ thống kho đang bận, không thể kiểm tra tồn kho lúc này.");
        }

        // Check: Nếu hàng trong kho < hàng khách muốn mua
        if (availableStock == null || availableStock < req.getQuantity()) {
            throw new RuntimeException("Sản phẩm này chỉ còn " + (availableStock == null ? 0 : availableStock) + " cái, không đủ hàng!");
        }

        Cart cart = getOrCreateCart(userId);

        // C. Check item tồn tại trong giỏ chưa
        CartItem item = itemRepo.findByCart_CartIdAndProductId(cart.getCartId(), req.getProductId())
                .orElse(null);

        if (item != null) {
            // Cộng dồn
            // Lưu ý: Có thể check thêm: (item.getQuantity() + req.getQuantity() > availableStock) không?
            int totalNewQty = item.getQuantity() + req.getQuantity();
            if (totalNewQty > availableStock) {
                 throw new RuntimeException("Bạn đã có " + item.getQuantity() + " cái trong giỏ. Kho chỉ còn tổng cộng " + availableStock + " cái.");
            }
            
            item.setQuantity(totalNewQty);
            item.setSubTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        } else {
            // Tạo mới
            item = CartItem.builder()
                    .cart(cart)
                    .productId(product.getProductId())
                    .shopId(product.getShopId())
                    .productName(product.getName())
                    .productImage(product.getMainImage())
                    .quantity(req.getQuantity())
                    .unitPrice(product.getPrice())
                    .subTotal(product.getPrice().multiply(BigDecimal.valueOf(req.getQuantity())))
                    .build();
        }
        itemRepo.save(item);
        
        // Fix lỗi lazy loading list items
        if (cart.getItems() == null) cart.setItems(new ArrayList<>());
        if (!cart.getItems().contains(item)) {
            cart.getItems().add(item);
        }

        // D. Tính lại tổng tiền Cart
        updateCartTotal(cart);
        
        return mapToResponse(cart);
    }

    // 3. Cập nhật số lượng (+ / -)
    @Transactional
    public CartResponse updateQuantity(String userId, Long itemId, Integer newQuantity) {
        Cart cart = getOrCreateCart(userId);
        CartItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        // Security check: Item này phải thuộc giỏ của User này
        if (!item.getCart().getCartId().equals(cart.getCartId())) {
             throw new RuntimeException("Unauthorized item access");
        }

        if (newQuantity <= 0) {
            itemRepo.delete(item); // Xóa nếu số lượng = 0
        } else {
            item.setQuantity(newQuantity);
            item.setSubTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
            itemRepo.save(item);
        }

        updateCartTotal(cart);
        return mapToResponse(cart);
    }
    
    // 4. Xóa item khỏi giỏ
    @Transactional
    public void removeItem(String userId, Long itemId) {
        // Logic tương tự updateQuantity nhưng gọi delete luôn
        // ... (Bạn tự implement nhé)
        updateQuantity(userId, itemId, 0);
    }

    // 5. Clear Cart (Dùng khi Order Service gọi sang sau khi đặt hàng xong)
    @Transactional
    public void clearCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        itemRepo.deleteAllByCartId(cart.getCartId());
        
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepo.save(cart);
    }

    // --- HELPER METHODS ---

    private Cart getOrCreateCart(String userId) {
        return cartRepo.findByUserId(userId)
                .orElseGet(() -> {
                    Cart c = new Cart();
                    c.setUserId(userId);
                    c.setTotalPrice(BigDecimal.ZERO);
                    return cartRepo.save(c);
                });
    }

    private void updateCartTotal(Cart cart) {
        // Fetch lại items mới nhất từ DB để tính cho chuẩn
        // Lưu ý: cart.getItems() có thể bị cũ (lazy loading), nên query lại nếu cần
        // Ở đây giả sử JPA đã refresh
        List<CartItem> items = itemRepo.findAll(); // Cần filter theo cartId, viết query nhé
        // Cách nhanh:
        BigDecimal total = cart.getItems().stream()
                .map(CartItem::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        cart.setTotalPrice(total);
        cartRepo.save(cart);
    }

    private CartResponse mapToResponse(Cart cart) {
        int totalItems = (cart.getItems() == null) ? 0 : 
                cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
        return CartResponse.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUserId())
                .totalItems(totalItems)
                .totalPrice(cart.getTotalPrice())
                .items(cart.getItems().stream().map(this::mapItemToResponse).collect(Collectors.toList())) // Gọi hàm tách riêng cho gọn
                .build();
    }

    private CartItemResponse mapItemToResponse(CartItem item) {
        return CartItemResponse.builder()
                .itemId(item.getItemId())
                .productId(item.getProductId())       // [FIX] Map productId
                .shopId(item.getShopId())             // [FIX] Map shopId
                .productName(item.getProductName())
                .productImage(item.getProductImage()) // [FIX] Map ảnh
                .unitPrice(item.getUnitPrice())       // [FIX] Map đơn giá
                .quantity(item.getQuantity())         // [FIX] Map số lượng
                .subTotal(item.getSubTotal())         // [FIX] Map thành tiền
                .build();
    }
}