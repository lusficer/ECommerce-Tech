package com.Lusficer.FulfillmentService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    // Gọi API Confirm Sale mà bạn đã viết bên Inventory Service
    // Logic: Tìm đơn hàng đang giữ (Reserved) -> Trừ kho thật -> Xóa giữ
    @PostMapping("/api/internal/inventory/confirm/{orderId}")
    void confirmSale(@PathVariable("orderId") String orderId);
}