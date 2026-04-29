package com.Lusficer.ShopService.service;

import com.Lusficer.ShopService.dto.*;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.exception.ResourceNotFoundException;
import com.Lusficer.ShopService.exception.BadRequestException;
import com.Lusficer.ShopService.repository.ShopRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepo;

    public List<Shop> getAllShops() {
        return shopRepo.findAll();
    }

    public ShopProfileResponse getShopById(String shopId) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));
        return toProfileResponse(shop);
    }

    // Manager xem shops của mình
    public List<Shop> getShopsByManager(String managerId) {
        return shopRepo.findByManagerId(managerId);
    }

    // Vendor xem shops của mình
    public List<Shop> getShopsByVendor(String vendorId) {
        return shopRepo.findByVendorId(vendorId);
    }

    public List<Shop> searchShops(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return shopRepo.findByShopNameContainingIgnoreCaseOrShopIdContainingIgnoreCase(keyword, keyword);
    }

    @Transactional
    public DeactivateShopResponse deactivateShop(String shopId, String reason) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        // TODO: check pending orders từ order-service trước khi deactivate
        boolean hasPendingOrders = false;
        if (hasPendingOrders) {
            throw new BadRequestException("Cannot deactivate shop with pending orders");
        }

        shop.setStatus("DEACTIVATED");
        shop.setDeactivatedAt(LocalDateTime.now());
        shop.setRestoreUntil(shop.getDeactivatedAt().plusDays(30));
        shopRepo.save(shop);

        System.out.println("[MOCK NOTIFICATION] Sending to managerId=" + shop.getManagerId()
                + ", reason: " + reason);

        return DeactivateShopResponse.builder()
                .shopId(shopId)
                .status("DEACTIVATED")
                .deactivatedAt(shop.getDeactivatedAt())
                .canRestoreUntil(shop.getRestoreUntil())
                .build();
    }

    // Manager tạo shop — vendorId null, assign sau
    @Transactional
    public ShopProfileResponse createShop(UpdateShopProfileRequest req, String managerId) {
        if (shopRepo.existsByManagerId(managerId)) {
            throw new BadRequestException("Manager already manages a shop.");
        }

        String generatedShopId = "SHP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Shop shop = Shop.builder()
                .shopId(generatedShopId)
                .shopName(req.shopName())
                .managerId(managerId)
                .address(req.address())
                .description(req.description())
                .logoUrl(req.logoUrl())
                .warehouseAddress(req.warehouseAddress())
                .warehouseCity(req.warehouseCity())
                .warehouseDistrict(req.warehouseDistrict())
                .warehouseWard(req.warehouseWard())
                .warehousePhone(req.warehousePhone())
                .status("ACTIVE")
                .build();

        shopRepo.save(shop);
        return toProfileResponse(shop);
    }

    // Admin hoặc Manager assign vendor vào shop sau khi tạo
    @Transactional
    public void assignVendorToShop(String shopId, String vendorId) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));
        requireActiveShop(shop);

        if (shop.getVendorId() != null) {
            throw new BadRequestException(
                "Shop already has vendor " + shop.getVendorId() + ". Remove current vendor first.");
        }

        shop.setVendorId(vendorId);
        shopRepo.save(shop);
    }

    // Xóa vendor khỏi shop (trước khi assign vendor mới)
    @Transactional
    public void removeVendorFromShop(String shopId) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));
        requireActiveShop(shop);

        if (shop.getVendorId() == null) {
            throw new BadRequestException("Shop does not have a vendor assigned.");
        }

        shop.setVendorId(null);
        shopRepo.save(shop);
    }

    @Transactional
    public ShopProfileResponse updateProfile(String shopId, UpdateShopProfileRequest req) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));
        requireActiveShop(shop);

        shop.setShopName(req.shopName());
        shop.setAddress(req.address());
        shop.setDescription(req.description());
        shop.setLogoUrl(req.logoUrl());

        if (req.warehouseAddress() != null) shop.setWarehouseAddress(req.warehouseAddress());
        if (req.warehouseCity() != null)    shop.setWarehouseCity(req.warehouseCity());
        if (req.warehouseDistrict() != null) shop.setWarehouseDistrict(req.warehouseDistrict());
        if (req.warehouseWard() != null)    shop.setWarehouseWard(req.warehouseWard());
        if (req.warehousePhone() != null)   shop.setWarehousePhone(req.warehousePhone());

        shopRepo.save(shop);
        return toProfileResponse(shop);
    }

    public boolean checkVendorBelongsToShop(String shopId, String vendorId) {
        return shopRepo.existsByShopIdAndVendorId(shopId, vendorId);
    }

    // Dùng managerId thay vì ownerId
    public boolean isOwner(String shopId, Authentication auth) {
        String userId = (String) auth.getPrincipal(); // principal là String userId
        return shopRepo.existsByShopIdAndManagerId(shopId, userId);
    }

    public ShopProfileResponse toProfileResponse(Shop shop) {
        return ShopProfileResponse.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .address(shop.getAddress())
                .description(shop.getDescription())
                .logoUrl(shop.getLogoUrl())
                .status(shop.getStatus())
                .managerId(shop.getManagerId())
                .vendorId(shop.getVendorId())
                .warehouseAddress(shop.getWarehouseAddress())
                .warehouseCity(shop.getWarehouseCity())
                .warehouseDistrict(shop.getWarehouseDistrict())
                .warehouseWard(shop.getWarehouseWard())
                .warehousePhone(shop.getWarehousePhone())
                .deactivatedAt(shop.getDeactivatedAt())
                .deactivationReason(shop.getDeactivationReason())
                .createdAt(shop.getCreatedAt())
                .updatedAt(shop.getUpdatedAt())
                .build();
    }

    private void requireActiveShop(Shop shop) {
        if (!"ACTIVE".equals(shop.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Shop is DEACTIVATED. Operation not allowed. Contact admin to restore.");
        }
    }
}
