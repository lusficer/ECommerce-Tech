package com.Lusficer.UserService.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USER_STATUS", schema = "eCommerce_user_service")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatus {
    @Id
    @Column(name = "userId")
    private String userId;

    @Column(name = "isOnline")
    private Boolean isOnline;

    @Column(name = "isVerified")
    private Boolean isVerified;

    @Column(name = "isBanned")
    private Boolean isBanned;

    @Column(name = "banReason", columnDefinition = "TEXT")
    private String banReason;

    @Column(name = "lastLogin")
    private LocalDateTime lastLogin;
}
