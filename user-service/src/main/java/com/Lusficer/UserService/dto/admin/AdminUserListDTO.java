package com.Lusficer.UserService.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserListDTO {
    private String userId;
    private String name;
    private String email;
    private String phone;
    private String role;
    private Boolean isBanned;
    private Boolean isVerified;
    private String banReason;
    private LocalDateTime createdAt;
}
