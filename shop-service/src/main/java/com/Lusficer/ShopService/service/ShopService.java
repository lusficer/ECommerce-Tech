// shop-service/src/main/java/com/Lusficer/ShopService/service/ShopService.java
package com.Lusficer.ShopService.service;

import com.Lusficer.ShopService.dto.*;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.entity.ShopVendorMapping;
import com.Lusficer.ShopService.exception.ResourceNotFoundException;
import com.Lusficer.ShopService.exception.BadRequestException;
import com.Lusficer.ShopService.repository.ShopRepository;
import com.Lusficer.ShopService.repository.ShopVendorMappingRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;
@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepo;
    private final ShopVendorMappingRepository mappingRepo;
    public List<Shop> getAllShops() {
        return shopRepo.findAll();
    }

    public ShopProfileResponse getShopById(String shopId) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        return ShopProfileResponse.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName()) 
                .address(shop.getAddress())
                .description(shop.getDescription())
                .logoUrl(shop.getLogoUrl())
                .createdAt(shop.getCreatedAt()) 
                .updatedAt(shop.getUpdatedAt())
                .build();
    }

    public List<Shop> getShopsByOwner(String ownerId) {
        return shopRepo.findByOwnerId(ownerId);
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

        boolean hasPendingOrders = false;

        if (hasPendingOrders) {
            throw new BadRequestException("Cannot delete shop with pending orders");
        }

        shop.setStatus("DEACTIVATED");
        shop.setDeactivatedAt(LocalDateTime.now());
        shop.setRestoreUntil(shop.getDeactivatedAt().plusDays(30));
        shopRepo.save(shop);

        System.out.println("[MOCK NOTIFICATION] Sending to userId=" + shop.getOwnerId() + 
                         ", reason: " + reason);

        return DeactivateShopResponse.builder()
                .shopId(shopId)
                .status("DEACTIVATED")
                .deactivatedAt(shop.getDeactivatedAt())
                .canRestoreUntil(shop.getRestoreUntil())
                .build();
    }

    @Transactional
    public void assignVendorToShop(String shopId, String vendorId) {
        if (!shopRepo.existsById(shopId)) {
            throw new ResourceNotFoundException("Shop not found");
        }

        Optional<ShopVendorMapping> existingMapping = mappingRepo.findByShopIdAndVendorId(shopId, vendorId);
        
        if (existingMapping.isPresent()) {
            ShopVendorMapping mapping = existingMapping.get();
            if ("INACTIVE".equals(mapping.getStatus())) {
                mapping.setStatus("ACTIVE"); 
                mappingRepo.save(mapping);
            }
            return; 
        }

        ShopVendorMapping newMapping = ShopVendorMapping.builder()
                .shopId(shopId)
                .vendorId(vendorId)
                .status("ACTIVE")
                .build();
        mappingRepo.save(newMapping);
    }

    public List<Shop> getShopsAssignedToVendor(String vendorId) {
        List<String> assignedShopIds = mappingRepo.findByVendorIdAndStatus(vendorId, "ACTIVE")
                .stream()
                .map(ShopVendorMapping::getShopId)
                .collect(Collectors.toList());

        return shopRepo.findAllById(assignedShopIds);
    }

    @Transactional
    public ShopProfileResponse createShop(UpdateShopProfileRequest req, String ownerId) {
        List<Shop> existingShops = shopRepo.findByOwnerId(ownerId);
        if (!existingShops.isEmpty()) {
            throw new BadRequestException("Manager this already owns a shop. Only 1 shop allowed per manager.");
        }

        String generatedShopId = "SHP-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Shop shop = Shop.builder()
                .shopId(generatedShopId)
                .shopName(req.shopName())
                .address(req.address())
                .description(req.description())
                .logoUrl(req.logoUrl())
                .ownerId(ownerId)
                .status("ACTIVE") 
                .build();

        shopRepo.save(shop);

        return ShopProfileResponse.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .address(shop.getAddress())
                .description(shop.getDescription())
                .logoUrl(shop.getLogoUrl())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Transactional
    public ShopProfileResponse updateProfile(String shopId, UpdateShopProfileRequest req) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        shop.setShopName(req.shopName());
        shop.setAddress(req.address());
        shop.setDescription(req.description());
        shop.setLogoUrl(req.logoUrl());
        shopRepo.save(shop);

        return ShopProfileResponse.builder()
                .shopId(shopId)
                .shopName(shop.getShopName())
                .address(shop.getAddress())
                .description(shop.getDescription())
                .logoUrl(shop.getLogoUrl())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public boolean checkVendorBelongsToShop(String shopId, String vendorId) {
        return mappingRepo.existsByShopIdAndVendorIdAndStatus(shopId, vendorId, "ACTIVE");
    }

    public boolean isOwner(String shopId, Authentication auth) {
        String userId = ((UserDetails) auth.getPrincipal()).getUsername();
        return shopRepo.existsByShopIdAndOwnerId(shopId, userId);
    }
}