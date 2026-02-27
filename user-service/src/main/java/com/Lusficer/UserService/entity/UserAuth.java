package com.Lusficer.UserService.entity;

import java.time.LocalDateTime; 

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "USER_AUTH", schema = "eCommerce_user_service")
public class UserAuth {
    @Id
    @Column(name = "authId")
    private String authId;

    @Column(name = "userId")
    private String userId;

    @Column(name = "provider")
    private String provider;

    @Column(name = "passwordHash")
    private String passwordHash;

    @Column(name = "oauthId")
    private String oauthId;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;
}