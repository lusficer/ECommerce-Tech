package com.Lusficer.CartService.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "CART")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    @Column(nullable = false, unique = true)
    private String userId; // Mỗi user chỉ có 1 giỏ

    private BigDecimal totalPrice;

    private LocalDateTime updatedAt;

    // Quan hệ 1-N với CartItem
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();
    
    @PrePersist @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}