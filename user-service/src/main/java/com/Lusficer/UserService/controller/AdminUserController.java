package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.dto.admin.AdminUserListDTO;
import com.Lusficer.UserService.dto.admin.BanUserRequest;
import com.Lusficer.UserService.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Admin User Management")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "List users for admin", description = "Returns users with optional role, ban, and search filters")
    public ResponseEntity<Page<AdminUserListDTO>> listUsers(
        @RequestParam(name = "role", required = false) String role,
        @RequestParam(name = "isBanned", required = false) Boolean isBanned,
        @RequestParam(name = "search", required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminUserService.listUsers(role, isBanned, search, pageable));
    }

    @PutMapping("/{userId}/ban")
    @Operation(summary = "Update user ban status", description = "Bans or unbans a user account")
    public ResponseEntity<Map<String, String>> setBanStatus(
            @PathVariable("userId") String userId,
            @RequestBody @Valid BanUserRequest request) {
        adminUserService.setBanStatus(userId, request.getBanned(), request.getReason());
        return ResponseEntity.ok(Map.of("message", "User ban status updated"));
    }
}
