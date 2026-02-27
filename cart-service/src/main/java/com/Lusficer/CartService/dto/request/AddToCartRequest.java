package com.Lusficer.CartService.dto.request;

import lombok.Data;

@Data
public class AddToCartRequest {
    private String productId;
    private Integer quantity;
}