package com.Lusficer.OrderService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore; // <--- Import cái này
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ORDER_ITEMS")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne
    @JoinColumn(name = "orderId")
    @JsonIgnore  // <--- THÊM DÒNG NÀY: Ngăn không cho JSON in ngược lại Order cha
    @ToString.Exclude // (Optional) Ngăn Lombok in vòng lặp khi debug
    private Order order;

    private String productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}