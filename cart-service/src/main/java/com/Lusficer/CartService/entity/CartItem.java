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
    @JsonIgnore // Chặn vòng lặp vô tận khi convert JSON
    @ToString.Exclude
    private Cart cart;

    private String productId;
    private String shopId;       // Lưu để sau này tách đơn theo Shop
    private String productName;  // Snapshot tên
    private String productImage; // Snapshot ảnh

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subTotal; // = quantity * unitPrice
}