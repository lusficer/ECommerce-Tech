
package com.Lusficer.CartService.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class CartItemResponse {
    private Long itemId;
    private String productId;
    private String productName;
    private String productImage;
    private String shopId;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subTotal;
}