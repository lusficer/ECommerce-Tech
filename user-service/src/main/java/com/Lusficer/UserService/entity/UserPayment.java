package com.Lusficer.UserService.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
@Entity
@Table(name = "USER_PAYMENT", schema = "eCommerce_user_service")
@Data
public class UserPayment {
    @Id
    @Column(name = "paymentId")
    private String paymentId;

    @Column(name = "userId")
    private String userId;

    @Column(name = "cardNumber")
    private String cardNumber;

    @Column(name = "cardHolder")
    private String cardHolder;

    @Column(name = "expiryDate")
    private String expiryDate;

    @Column(name = "bankName")
    private String bankName;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;
}