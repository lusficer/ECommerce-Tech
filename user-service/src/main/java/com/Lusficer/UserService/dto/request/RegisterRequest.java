package com.Lusficer.UserService.dto.request;

import com.Lusficer.UserService.entity.UserRole.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Registration request payload.
 * The `role` field is an enum (UserRole.RoleName) so Swagger UI will present
 * a dropdown of allowed values (ADMIN, CUSTOMER, SHOP_MANAGER, VENDOR, GUEST).
 */
public record RegisterRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        @NotBlank String phone,
        @NotBlank String password,
        @NotNull @Schema(description = "Role to assign to the new user", implementation = RoleName.class)
        RoleName role
) {}