package com.Lusficer.InventoryService.service;

import com.Lusficer.InventoryService.entity.Inventory;
import com.Lusficer.InventoryService.repository.InventoryRepository;
import com.Lusficer.InventoryService.dto.response.ForecastResultDto; 
import com.Lusficer.InventoryService.repository.StockLogRepository;
import com.Lusficer.InventoryService.client.ProductClient;
import com.Lusficer.InventoryService.dto.ProductDto;
import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class StockForecastService {

    @Autowired private InventoryRepository inventoryRepo;
    @Autowired private StockLogRepository logRepo;
    @Autowired private ProductClient productClient; 


   @Transactional
    public List<ForecastResultDto> trainAndPredict(boolean applyChanges) {
        List<ForecastResultDto> report = new ArrayList<>();
        List<Inventory> products = inventoryRepo.findAll();

        for (Inventory product : products) {
            Map<Integer, Integer> salesHistory = logRepo.getDailySalesLast30Days(product.getProductId());

            if (salesHistory.isEmpty()) {
                report.add(ForecastResultDto.builder()
                        .productId(product.getProductId())
                        .productName("Unknown (" + product.getProductId() + ")")
                        .status("NO_DATA")
                        .build());
                continue;
            }

            SimpleRegression regression = new SimpleRegression();
            for (Map.Entry<Integer, Integer> entry : salesHistory.entrySet()) {
                regression.addData(entry.getKey(), entry.getValue());
            }

            double predictedSales = regression.predict(31);
            if (Double.isNaN(predictedSales) || predictedSales < 0) {
                predictedSales = 0.0;
            }

            int newSafetyLevel = (int) Math.ceil(predictedSales * 7 * 1.1);
            if (newSafetyLevel < 5) newSafetyLevel = 5;

            double slope = regression.getSlope();
            if (Double.isNaN(slope)) slope = 0.0;

            String label;
            String recommendation;

           String slopeStr = String.format("%.2f", slope);

            if (slope >= 0.5) {
                label = "HIGH VELOCITY (Surging Demand)";
                recommendation = String.format(
                    "Linear Regression analysis detects a steep positive slope (Slope=%s). " +
                    "Sales Velocity is accelerating rapidly. " +
                    "RECOMMENDATION: Immediately expand Safety Stock coverage to mitigate high Stockout Risk.", 
                    slopeStr);
            } 
            else if (slope >= 0.15) {
                label = "POSITIVE TREND (Growing)";
                recommendation = String.format(
                    "Demand trend exhibits a moderate upward trajectory (Slope=%s). " +
                    "RECOMMENDATION: Incrementally adjust Safety Stock levels to preemptively accommodate projected near-term demand.", 
                    slopeStr);
            } 
            else if (slope > -0.15) {
                label = "STABLE (Equilibrium)";
                recommendation = String.format(
                    "Demand volatility is low (Slope=%s), indicating Market Equilibrium. " +
                    "RECOMMENDATION: Maintain current inventory levels to optimize Holding Costs and capital efficiency.", 
                    slopeStr);
            } 
            else {
                label = "DECLINING (Cooling Down)";
                recommendation = String.format(
                    "The model detects a significant cooling signal (Slope=%s). " +
                    "RECOMMENDATION: Halt replenishment orders and activate Clearance strategies to minimize Dead Stock accumulation.", 
                    slopeStr);
            }

            String status = "STABLE";
            
            if (applyChanges) {
                product.setSafetyStockLevel(newSafetyLevel);
                product.setLastTrendSlope(slope); 
                product.setLastForecastDate(LocalDateTime.now());
                
                inventoryRepo.save(product);
                status = "UPDATED";
            } else if (!product.getSafetyStockLevel().equals(newSafetyLevel)) {
                status = "UPDATE_NEEDED";
            }

            String prettyName;
            try {
                ProductDto productInfo = productClient.getProductById(product.getProductId());
                prettyName = productInfo != null ? productInfo.getName() : "Unknown Product";
            } catch (Exception e) {
                prettyName = "Unknown (" + product.getProductId() + ")";
                System.err.println("Warning: Failed to fetch name for " + product.getProductId());
            }

            report.add(ForecastResultDto.builder()
                    .productId(product.getProductId())
                    .productName(prettyName)
                    .trendSlope(slope)
                    .trendLabel(label)              
                    .aiRecommendation(recommendation) 
                    .predictedNextDay(predictedSales)
                    .oldSafetyStock(product.getSafetyStockLevel())
                    .newSafetyStock(newSafetyLevel)
                    .status(status)
                    .build());
        }
        return report;
    }

    @Scheduled(cron = "0 0 0 * * ?") 
    public void scheduledJob() {
        trainAndPredict(true);
        System.out.println("Scheduled AI Job Completed.");
    }
}