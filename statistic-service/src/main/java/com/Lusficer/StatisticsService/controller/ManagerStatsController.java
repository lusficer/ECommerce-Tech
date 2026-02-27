package com.Lusficer.StatisticsService.controller;

import com.Lusficer.StatisticsService.dto.DailySalesDto;
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
@RequestMapping("/api/manager/stats")
@SecurityRequirement(name = "Bearer Token")
@PreAuthorize("hasRole('ROLE_SHOP_MANAGER')") // Bảo mật
public class ManagerStatsController {

    @Autowired private StatisticsService statsService;

    // UC: View All Vendors’ Sales Statistics & Generate Charts
    @GetMapping("/platform-revenue")
    @Operation(summary = "Get aggregated revenue for the whole platform (for charts)")
    public ResponseEntity<List<DailySalesDto>> getPlatformRevenue(
            @RequestParam("startDate") LocalDate startDate,
            @RequestParam("endDate") LocalDate endDate) {
        return ResponseEntity.ok(statsService.getPlatformRevenue(startDate, endDate));
    }
    
    // API xuất báo cáo (Excel/PDF) sẽ làm sau ở đây
}