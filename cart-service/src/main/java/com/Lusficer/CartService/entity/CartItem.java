package com.Lusficer.CartService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "CART_ITEM")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cartId")
    @JsonIgnore 
    @ToString.Exclude
    private Cart cart;

    private String productId;
    private String shopId;       
    private String productName;  
    private String productImage; 
    private Integer discountPercentage;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subTotal; 
}