package com.Lusficer.OrderService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "shop-service", url = "http://localhost:8082/api/shops")
public interface ShopClient {

    /**
     * Checks whether a vendor has access to a specific shop.
     */
    @GetMapping("/{shopId}/check-vendor/{vendorId}")
    boolean checkVendorAccess(
            @PathVariable("shopId") String shopId, 
            @PathVariable("vendorId") String vendorId);
}