package com.Lusficer.UserService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "shop-service", url = "http://localhost:8082")
public interface ShopClient {
    
    /**
     * Get owner ID (Shop Manager) for a shop
     */
    @GetMapping("/api/internal/shops/{shopId}/owner")
    String getShopOwner(@PathVariable("shopId") String shopId);
    
    /**
     * Get all vendor IDs for a shop (active vendors only)
     */
    @GetMapping("/api/internal/shops/{shopId}/vendors")
    List<String> getShopVendors(@PathVariable("shopId") String shopId);
}
