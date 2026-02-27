package com.Lusficer.StatisticsService.controller;

import com.Lusficer.StatisticsService.entity.DailySalesStats;
import com.Lusficer.StatisticsService.entity.ProductSalesStats;
import com.Lusficer.StatisticsService.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vendor/stats")
@SecurityRequirement(name = "Bearer Token")
@PreAuthorize("hasRole('ROLE_VENDOR')")
public class VendorStatsController {

    @Autowired private StatisticsService statsService;

    // UC: View Own Product Sales (Biểu đồ doanh thu shop)
    @GetMapping("/{shopId}/revenue")
    @Operation(summary = "Get revenue stats for a specific shop")
    public ResponseEntity<List<DailySalesStats>> getShopRevenue(
            @PathVariable("shopId") String shopId,
            @RequestParam("startDate") LocalDate startDate,
            @RequestParam("endDate") LocalDate endDate) {
        // Cần check quyền: Vendor gọi có phải chủ shopId này không? (Logic ở Gateway hoặc Service)
        return ResponseEntity.ok(statsService.getShopRevenue(shopId, startDate, endDate));
    }

    // UC: View Own Product Sales (Top sản phẩm)
    @GetMapping("/{shopId}/top-products")
    @Operation(summary = "Get top selling products for a shop")
    public ResponseEntity<List<ProductSalesStats>> getTopProducts(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(statsService.getTopProductsByShop(shopId));
    }
}