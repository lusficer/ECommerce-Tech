package com.Lusficer.CartService.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class CartResponse {
    private Long cartId;
    private String userId;
    private BigDecimal totalPrice;
    private Integer totalItems;
    private List<CartItemResponse> items;
}
