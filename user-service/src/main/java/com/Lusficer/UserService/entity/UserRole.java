package com.Lusficer.UserService.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "USER_ROLE")
public class UserRole {

    @Id
    private String roleId;  

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleName roleName;

    private LocalDateTime createdAt;

    public enum RoleName {
        ADMIN, CUSTOMER, SHOP_MANAGER, VENDOR, GUEST, WAREHOUSE_MANAGER, SHIPPER 
       }
}
