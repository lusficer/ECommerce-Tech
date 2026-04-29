package com.Lusficer.ShopService.controller;

import com.Lusficer.ShopService.dto.WarehouseInfoDTO;
import com.Lusficer.ShopService.entity.Shop;
import com.Lusficer.ShopService.exception.ResourceNotFoundException;
import com.Lusficer.ShopService.repository.ShopRepository;
import com.Lusficer.ShopService.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/internal/shops")
@RequiredArgsConstructor
@Tag(name = "Internal Shop", description = "Internal service-to-service shop APIs")
public class InternalShopController {

    private final ShopRepository shopRepository;
    private final ShopService shopService;
    @GetMapping("/by-vendor/{vendorId}")
    public ResponseEntity<List<String>> getShopIdsByVendor(
            @PathVariable("vendorId") String vendorId) {
        List<String> shopIds = shopService.getShopsByVendor(vendorId)
                .stream()
                .map(Shop::getShopId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(shopIds);
    }

    @GetMapping("/{shopId}/warehouse-info")
    @Operation(summary = "Get warehouse pickup info (fallback to shop address when warehouseAddress is null)")
    public ResponseEntity<WarehouseInfoDTO> getWarehouseInfo(@PathVariable("shopId") String shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        boolean hasWarehouse = shop.getWarehouseAddress() != null;

        WarehouseInfoDTO dto = WarehouseInfoDTO.builder()
                .warehouseAddress(hasWarehouse ? shop.getWarehouseAddress() : shop.getAddress())
                .warehouseCity(hasWarehouse ? shop.getWarehouseCity() : null)
                .warehouseDistrict(hasWarehouse ? shop.getWarehouseDistrict() : null)
                .warehouseWard(hasWarehouse ? shop.getWarehouseWard() : null)
                .warehousePhone(shop.getWarehousePhone())
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * Get shop owner ID (Shop Manager)
     * Used by notification service to send notifications to shop owner
     */
    @GetMapping("/{shopId}/owner")
    @Operation(summary = "Get shop owner ID", description = "Returns the owner/manager ID of the shop")
    public ResponseEntity<String> getShopOwner(@PathVariable("shopId") String shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        return ResponseEntity.ok(shop.getManagerId());
    }

    /**
     * Get all active vendor IDs for a shop
     * Used by notification service to send notifications to all vendors of a shop
     */
    @GetMapping("/{shopId}/vendors")
    @Operation(summary = "Get active vendors", description = "Returns list of active vendor IDs for the shop")
    public ResponseEntity<List<String>> getShopVendors(@PathVariable("shopId") String shopId) {
        Shop shop = shopRepository.findById(shopId)
            .orElseThrow(() -> new ResourceNotFoundException("Shop not found"));

        List<String> vendorIds = shop.getVendorId() == null || shop.getVendorId().isBlank()
            ? List.of()
            : List.of(shop.getVendorId());

        return ResponseEntity.ok(vendorIds);
    }

    
}
