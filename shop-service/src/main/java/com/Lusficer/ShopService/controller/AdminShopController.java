package com.Lusficer.ShopService.controller;

import com.Lusficer.ShopService.dto.admin.AdminShopListDTO;
import com.Lusficer.ShopService.dto.admin.ShopStatusRequest;
import com.Lusficer.ShopService.service.AdminShopService;
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
@RequestMapping("/api/admin/shops")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Admin Shop Management")
public class AdminShopController {

    private final AdminShopService adminShopService;

    @GetMapping
    @Operation(summary = "List shops for admin", description = "Returns shops with optional status and keyword filters")
    public ResponseEntity<Page<AdminShopListDTO>> listShops(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "search", required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminShopService.listShops(status, search, pageable));
    }

    @PutMapping("/{shopId}/status")
    @Operation(summary = "Update shop status", description = "Sets shop status to ACTIVE or DEACTIVATED")
    public ResponseEntity<Map<String, String>> updateShopStatus(
            @PathVariable("shopId") String shopId,
            @RequestBody @Valid ShopStatusRequest request) {
        adminShopService.updateShopStatus(shopId, request.getStatus(), request.getReason());
        return ResponseEntity.ok(Map.of("message", "Shop status updated"));
    }
}
