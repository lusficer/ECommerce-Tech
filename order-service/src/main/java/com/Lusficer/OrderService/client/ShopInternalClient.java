package com.Lusficer.OrderService.client;

import com.Lusficer.OrderService.dto.response.WarehouseInfoDTO;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "shop-service", contextId = "shopInternalClient", url = "http://localhost:8082")
public interface ShopInternalClient {

    @GetMapping("/api/internal/shops/{shopId}/warehouse-info")
    WarehouseInfoDTO getWarehouseInfo(@PathVariable("shopId") String shopId);

    @GetMapping("/api/internal/shops/by-vendor/{vendorId}")
    List<String> getShopIdsByVendor(@PathVariable("vendorId") String vendorId);

    
}
