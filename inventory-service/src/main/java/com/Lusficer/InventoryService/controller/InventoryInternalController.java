package com.Lusficer.InventoryService.controller;

import com.Lusficer.InventoryService.dto.response.InventoryResponse;
import com.Lusficer.InventoryService.dto.request.StockRequest;
import com.Lusficer.InventoryService.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/internal/inventory")
public class InventoryInternalController {

    @Autowired private InventoryService inventoryService;

    // 1. API: Xem chi tiết tồn kho (Product Service gọi)
    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponse> getInventoryDetail(@PathVariable("productId") String productId) {
        // Bạn cần viết thêm hàm getInventoryDetail trong Service trả về DTO này
        // Logic: map từ Entity -> DTO
        return ResponseEntity.ok(inventoryService.getInventoryDetail(productId));
    }

    // 2. API: Lấy nhanh số lượng có thể bán (Cart Service gọi)
    @GetMapping("/{productId}/available")
    public ResponseEntity<Integer> getAvailable(@PathVariable("productId") String productId) {
        return ResponseEntity.ok(inventoryService.getAvailableStock(productId));
    }

    // 3. API: Giữ hàng (Order Service gọi)
    @PostMapping("/reserve")
    public ResponseEntity<?> reserveStock(@RequestBody StockRequest req) {
        inventoryService.reserveStock(req.getProductId(), req.getQuantity(), req.getOrderId());
        return ResponseEntity.ok("Reserved successfully");
    }

    // 4. API: Confirm bán (Khi thanh toán xong)
    @PostMapping("/confirm/{orderId}")
    public ResponseEntity<?> confirmSale(@PathVariable("orderId") String orderId) {
        inventoryService.confirmSale(orderId);
        return ResponseEntity.ok("Confirmed sale");
    }

    // 5. API: Nhả hàng (Khi hủy đơn)
    @PostMapping("/release/{orderId}")
    public ResponseEntity<?> releaseStock(@PathVariable("orderId") String orderId) {
        inventoryService.releaseStock(orderId);
        return ResponseEntity.ok("Stock released");
    }

    @GetMapping("/check-stock")
    public ResponseEntity<Map<String, Integer>> checkStock(@RequestParam("productIds") List<String> productIds) {
        return ResponseEntity.ok(inventoryService.getStockStatus(productIds));
    }
}