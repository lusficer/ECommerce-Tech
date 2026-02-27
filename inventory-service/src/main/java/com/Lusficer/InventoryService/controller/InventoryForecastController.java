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
@Tag(name = "AI Forecast API", description = "API xem dự báo và điều khiển AI Inventory")
public class InventoryForecastController {

    @Autowired
    private StockForecastService forecastService;

    @Autowired
    private InventoryService inventoryService;

    // 1. Xem trước (Preview): Admin xem AI dự đoán gì, chưa lưu vào DB
    // Frontend sẽ dùng API này để vẽ biểu đồ
    @GetMapping("/preview")
    @Operation(summary = "Xem trước dự báo (Không lưu)", description = "Trả về danh sách dự báo dựa trên dữ liệu hiện tại.")
    public ResponseEntity<List<ForecastResultDto>> getForecastPreview() {
        List<ForecastResultDto> result = forecastService.trainAndPredict(false); // false = Không lưu
        return ResponseEntity.ok(result);
    }

    // 2. Kích hoạt (Run): Admin bấm nút "Áp dụng ngay"
    @PostMapping("/run")
    @Operation(summary = "Chạy và Áp dụng dự báo", description = "Tính toán và cập nhật Safety Stock mới vào Database ngay lập tức.")
    public ResponseEntity<List<ForecastResultDto>> runForecastManually() {
        List<ForecastResultDto> result = forecastService.trainAndPredict(true); // true = Lưu luôn
        return ResponseEntity.ok(result);
    }
    
}