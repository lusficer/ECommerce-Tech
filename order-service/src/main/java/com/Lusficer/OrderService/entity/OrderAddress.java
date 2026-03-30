package com.Lusficer.OrderService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ORDER_ADDRESS")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderAddress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "orderId")
    @JsonIgnore
    @ToString.Exclude
    private Order order;

    private String fullName;
    private String phone;
    private String addressLine;
    private String city;
    private String district;
    private String ward;
}