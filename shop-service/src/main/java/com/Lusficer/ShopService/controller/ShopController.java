package com.Lusficer.ShopService.controller;

import com.Lusficer.ShopService.dto.*;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Shop Management")
public class ShopController {

    private final ShopService shopService;

    /**
     * Lists all shops (admin only).
     */
    @GetMapping
    @Operation(summary = "Get all shops", description = "Retrieve a list of all available shops")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all shops",
        content = @Content(schema = @Schema(implementation = Shop.class)))
    public ResponseEntity<List<Shop>> getAllShops() {
        List<Shop> shops = shopService.getAllShops();
        return ResponseEntity.ok(shops);
    }

    /**
     * Retrieves a shop profile by id.
     */
    @GetMapping("/{shopId}")
    @Operation(summary = "Get shop by ID", description = "Retrieve a specific shop profile for customers")
    public ResponseEntity<ShopProfileResponse> getShopById(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(shopService.getShopById(shopId));
    }

    /**
     * Lists shops owned by a specific owner.
     */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SHOP_MANAGER')")
    @Operation(summary = "Get shops by owner", description = "Retrieve shops that belong to a specific owner/userId")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved owner's shops",
        content = @Content(schema = @Schema(implementation = Shop.class)))
    public ResponseEntity<List<Shop>> getShopsByOwner(@PathVariable("ownerId") String ownerId) {
        List<Shop> shops = shopService.getShopsByOwner(ownerId);
        return ResponseEntity.ok(shops);
    }

    /**
     * Deactivates a shop after confirmation.
     */
    @DeleteMapping("/{shopId}")
    @PreAuthorize("hasRole('SHOP_MANAGER') and @shopService.isOwner(#shopId, authentication)")
    public ResponseEntity<DeactivateShopResponse> deactivateShop(
            @PathVariable("shopId") String shopId,
            @RequestBody @Valid DeactivateShopRequest request) {

        if (!request.confirm()) { 
            throw new IllegalArgumentException("Confirmation is required");
        }

        DeactivateShopResponse response = shopService.deactivateShop(shopId, request.reason());
        return ResponseEntity.ok(response);
    }

    /**
     * Updates shop profile fields.
     */
    @PutMapping("/{shopId}/profile")
    @PreAuthorize("hasRole('SHOP_MANAGER') and @shopService.isOwner(#shopId, authentication)")
    public ResponseEntity<ShopProfileResponse> updateProfile(
            @PathVariable("shopId") String shopId,
            @RequestBody @Valid UpdateShopProfileRequest request) {

        ShopProfileResponse response = shopService.updateProfile(shopId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Creates a new shop (one per manager).
     */
    @PostMapping
    @PreAuthorize("hasRole('SHOP_MANAGER')")
    @Operation(summary = "Create a new shop", description = "Creates a new shop. Strictly limited to 1 shop per manager.")
    public ResponseEntity<ShopProfileResponse> createShop(
            @RequestParam("ownerId") String ownerId, 
            @RequestBody @Valid UpdateShopProfileRequest request) {
        
        if (ownerId == null || ownerId.trim().isEmpty()) {
            throw new IllegalArgumentException("ownerId must not be empty.");
        }

        ShopProfileResponse response = shopService.createShop(request, ownerId);
        return ResponseEntity.ok(response);
    }

    /**
     * Assigns a vendor to a shop.
     */
    @PostMapping("/{shopId}/vendors/{vendorId}")
    public ResponseEntity<String> assignVendorToShop(
            @PathVariable("shopId") String shopId, 
            @PathVariable("vendorId") String vendorId) {
        shopService.assignVendorToShop(shopId, vendorId);
        return ResponseEntity.ok("Assigned vendor " + vendorId + " to shop " + shopId + " successfully.");
    }

    /**
     * Lists shops assigned to the vendor.
     */
    @GetMapping("/my-assigned-shops")
    public ResponseEntity<List<Shop>> getMyAssignedShops(
            @RequestHeader("userId") String vendorId) {
        return ResponseEntity.ok(shopService.getShopsAssignedToVendor(vendorId));
    }

    /**
     * Checks if a vendor is assigned to a shop.
     */
    @GetMapping("/{shopId}/check-vendor/{vendorId}")
    public ResponseEntity<Boolean> checkVendorAccess(
            @PathVariable("shopId") String shopId, 
            @PathVariable("vendorId") String vendorId) {
        boolean hasAccess = shopService.checkVendorBelongsToShop(shopId, vendorId);
        return ResponseEntity.ok(hasAccess);
    }

    /**
     * Searches shops by keyword.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Shop>> searchShops(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(shopService.searchShops(keyword));
    }
}