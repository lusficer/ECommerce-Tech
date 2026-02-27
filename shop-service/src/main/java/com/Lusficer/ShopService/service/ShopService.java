// shop-service/src/main/java/com/Lusficer/ShopService/service/ShopService.java
package com.Lusficer.ShopService.service;

import com.Lusficer.ShopService.dto.*;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.exception.ResourceNotFoundException;
import com.Lusficer.ShopService.exception.BadRequestException;
import com.Lusficer.ShopService.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepo;

    public List<Shop> getAllShops() {
        return shopRepo.findAll();
    }

    public List<Shop> getShopsByOwner(String ownerId) {
        return shopRepo.findByOwnerId(ownerId);
    }

    @Transactional
    public DeactivateShopResponse deactivateShop(String shopId, String reason) {
        Shop shop = shopRepo.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        // Mock: Assuming there are NO pending orders
        boolean hasPendingOrders = false;

        if (hasPendingOrders) {
            throw new BadRequestException("Cannot delete shop with pending orders");
        }

        shop.setStatus("DEACTIVATED");
        shop.setDeactivatedAt(LocalDateTime.now());
        shop.setRestoreUntil(shop.getDeactivatedAt().plusDays(30));
        shopRepo.save(shop);

        // Mock: Log instead of calling notification-service
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

    public boolean isOwner(String shopId, Authentication auth) {
        String userId = ((UserDetails) auth.getPrincipal()).getUsername();
        return shopRepo.existsByShopIdAndOwnerId(shopId, userId);
    }
}