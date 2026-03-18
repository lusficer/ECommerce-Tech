package com.Lusficer.StatisticsService.controller;

import com.Lusficer.StatisticsService.dto.DailySalesDto;
import com.Lusficer.StatisticsService.entity.DailySalesStats;
import com.Lusficer.StatisticsService.entity.ProductSalesStats;
import com.Lusficer.StatisticsService.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/stats")
@SecurityRequirement(name = "Bearer Token")
@PreAuthorize("hasRole('ROLE_SHOP_MANAGER')") 
public class ManagerStatsController {

    @Autowired private StatisticsService statsService;

    @GetMapping("/platform-revenue")
    @Operation(summary = "Get aggregated revenue for the whole platform (for charts)")
    public ResponseEntity<List<DailySalesDto>> getPlatformRevenue(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(statsService.getPlatformRevenue(startDate, endDate));
    }
    
    @GetMapping("/shop/{shopId}/revenue")
    @Operation(summary = "Get revenue for a specific shop")
    public ResponseEntity<List<DailySalesStats>> getShopRevenue(
            @PathVariable("shopId") String shopId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(statsService.getShopRevenue(shopId, startDate, endDate));
    }

    @GetMapping("/shop/{shopId}/top-products")
    @Operation(summary = "Get top products for a specific shop")
    public ResponseEntity<List<ProductSalesStats>> getShopTopProducts(@PathVariable("shopId") String shopId) {
        return ResponseEntity.ok(statsService.getTopProductsByShop(shopId));
    }
}