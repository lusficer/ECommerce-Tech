// shop-service/src/main/java/com/Lusficer/ShopService/controller/ShopController.java
package com.Lusficer.ShopService.controller;

import com.Lusficer.ShopService.dto.*;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
@Tag(name = "Shop Management")
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    @Operation(summary = "Get all shops", description = "Retrieve a list of all available shops")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all shops",
        content = @Content(schema = @Schema(implementation = Shop.class)))
    public ResponseEntity<List<Shop>> getAllShops() {
        List<Shop> shops = shopService.getAllShops();
        return ResponseEntity.ok(shops);
    }

    @GetMapping("/owner/{ownerId}")
    @Operation(summary = "Get shops by owner", description = "Retrieve shops that belong to a specific owner/userId")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved owner's shops",
        content = @Content(schema = @Schema(implementation = Shop.class)))
    public ResponseEntity<List<Shop>> getShopsByOwner(@PathVariable String ownerId) {
        List<Shop> shops = shopService.getShopsByOwner(ownerId);
        return ResponseEntity.ok(shops);
    }

    @DeleteMapping("/{shopId}")
    @PreAuthorize("hasRole('SHOP_MANAGER') and @shopService.isOwner(#shopId, authentication)")
    public ResponseEntity<DeactivateShopResponse> deactivateShop(
            @PathVariable String shopId,
            @RequestBody @Valid DeactivateShopRequest request) {

        if (!request.confirm()) { 
            throw new IllegalArgumentException("Confirmation is required");
        }

        DeactivateShopResponse response = shopService.deactivateShop(shopId, request.reason());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{shopId}/profile")
    @PreAuthorize("hasRole('SHOP_MANAGER') and @shopService.isOwner(#shopId, authentication)")
    public ResponseEntity<ShopProfileResponse> updateProfile(
            @PathVariable String shopId,
            @RequestBody @Valid UpdateShopProfileRequest request) {

        ShopProfileResponse response = shopService.updateProfile(shopId, request);
        return ResponseEntity.ok(response);
    }
}