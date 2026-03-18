package com.Lusficer.InventoryService.controller;

import com.Lusficer.InventoryService.dto.response.ForecastResultDto;
import com.Lusficer.InventoryService.service.StockForecastService;
import com.Lusficer.InventoryService.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/internal/forecast")
@Tag(name = "AI Forecast API", description = "API for viewing forecasts and controlling AI Inventory")
public class InventoryForecastController {

    @Autowired
    private StockForecastService forecastService;

    @Autowired
    private InventoryService inventoryService;

    
    @GetMapping("/preview")
    @Operation(summary = "Preview forecast (Not saved)", description = "Returns a list of forecasts based on current data.")
    public ResponseEntity<List<ForecastResultDto>> getForecastPreview() {
        List<ForecastResultDto> result = forecastService.trainAndPredict(false); // false = Not saved
        return ResponseEntity.ok(result);
    }

    @PostMapping("/run")
    @Operation(summary = "Run and Apply forecast", description = "Calculates and updates new Safety Stock to Database immediately.")
    public ResponseEntity<List<ForecastResultDto>> runForecastManually() {
        List<ForecastResultDto> result = forecastService.trainAndPredict(true); // true = Save immediately
        return ResponseEntity.ok(result);
    }
    
}