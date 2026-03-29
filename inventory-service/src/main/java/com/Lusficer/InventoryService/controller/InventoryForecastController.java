package com.Lusficer.InventoryService.controller;

import com.Lusficer.InventoryService.dto.response.ForecastResultDto;
import com.Lusficer.InventoryService.service.StockForecastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internal/forecast")
@Tag(name = "AI Forecast API", description = "API for viewing forecasts and controlling AI Inventory")
public class InventoryForecastController {

    @Autowired
    private StockForecastService forecastService;

    @GetMapping("/preview")
    @Operation(summary = "Preview forecast (Not saved)",
               description = "Pass shopId to filter by shop, omit for all products.")
    public ResponseEntity<List<ForecastResultDto>> getForecastPreview(
            @RequestParam(value = "shopId", required = false) String shopId) {

        return ResponseEntity.ok(forecastService.trainAndPredict(false, shopId));
    }

    @PostMapping("/run")
    @Operation(summary = "Run and Apply forecast",
               description = "Pass shopId to apply only for that shop.")
    public ResponseEntity<List<ForecastResultDto>> runForecastManually(
            @RequestParam(value = "shopId", required = false) String shopId) {

        return ResponseEntity.ok(forecastService.trainAndPredict(true, shopId));
    }
}