package com.Lusficer.ShopService.service;

import com.Lusficer.ShopService.dto.admin.AdminShopListDTO;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminShopService {

    private static final String ACTIVE = "ACTIVE";
    private static final String DEACTIVATED = "DEACTIVATED";

    private final ShopRepository shopRepository;

    public Page<AdminShopListDTO> listShops(String status, String search, Pageable pageable) {
        String normalizedStatus = normalizeStatus(status);
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        return shopRepository.searchShopsForAdmin(normalizedStatus, normalizedSearch, pageable)
                .map(shop -> AdminShopListDTO.builder()
                        .shopId(shop.getShopId())
                        .shopName(shop.getShopName())
                        .status(shop.getStatus())
                        .vendorId(shop.getVendorId())
                        .managerId(shop.getManagerId())
                        .deactivationReason(shop.getDeactivationReason())
                        .createdAt(shop.getCreatedAt())
                        .deactivatedAt(shop.getDeactivatedAt())
                        .build());
    }

    @Transactional
    public void updateShopStatus(String shopId, String status, String reason) {
        String normalizedStatus = normalizeStatus(status);

        if (DEACTIVATED.equals(normalizedStatus) && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("Reason is required when status=DEACTIVATED");
        }

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Shop not found"));

        shop.setStatus(normalizedStatus);
        if (DEACTIVATED.equals(normalizedStatus)) {
            shop.setDeactivatedAt(LocalDateTime.now());
            shop.setDeactivationReason(reason.trim());
        } else {
            shop.setDeactivatedAt(null);
            shop.setDeactivationReason(null);
        }
        shopRepository.save(shop);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!ACTIVE.equals(normalizedStatus) && !DEACTIVATED.equals(normalizedStatus)) {
            throw new IllegalArgumentException("status must be ACTIVE or DEACTIVATED");
        }
        return normalizedStatus;
    }
}
