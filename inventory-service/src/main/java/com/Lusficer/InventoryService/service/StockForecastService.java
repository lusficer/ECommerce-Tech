package com.Lusficer.InventoryService.service;

import com.Lusficer.InventoryService.entity.Inventory;
import com.Lusficer.InventoryService.repository.InventoryRepository;
import com.Lusficer.InventoryService.dto.response.ForecastResultDto;
import com.Lusficer.InventoryService.repository.StockLogRepository;
import com.Lusficer.InventoryService.client.ProductClient;
import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StockForecastService {

    @Autowired private InventoryRepository inventoryRepo;
    @Autowired private StockLogRepository logRepo;
    @Autowired private ProductClient productClient;

    @Transactional
    public List<ForecastResultDto> trainAndPredict(boolean applyChanges, String shopId) {

        // ─── STEP 1: Load inventory, filter by shop if shopId is provided ───
        List<Inventory> products;
        if (shopId != null && !shopId.isBlank()) {
            Set<String> shopProductIds;
            try {
                shopProductIds = productClient.getProductsByShop(shopId)
                    .stream()
                    .map(p -> p.getProductId())   
                    .collect(java.util.stream.Collectors.toSet());
            } catch (Exception e) {
                System.err.println("Warning: could not fetch shop products, returning empty. " + e.getMessage());
                return Collections.emptyList();
            }
            products = inventoryRepo.findByProductIdInReadOnly(new ArrayList<>(shopProductIds));
        } else {
            products = inventoryRepo.findAll();
        }

        if (products.isEmpty()) return Collections.emptyList();

        // ─── STEP 2: Bulk load ALL daily sales — 1 query (was N queries) ─────
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Object[]> rawSales = logRepo.bulkGetDailySalesLast30Days(since);

        Map<String, Map<Integer, Integer>> salesByProduct = new HashMap<>();
        for (Object[] row : rawSales) {
            String pid     = (String)  row[0];
            int    day     = ((Number) row[1]).intValue();
            int    qty     = ((Number) row[2]).intValue();
            salesByProduct
                .computeIfAbsent(pid, k -> new HashMap<>())
                .put(day, qty);
        }

        // ─── STEP 3: Bulk fetch product names — 1 HTTP call (was N calls) ────
        List<String> productIds = products.stream()
            .map(Inventory::getProductId)
            .collect(Collectors.toList());

        Map<String, String> nameMap = new HashMap<>();
        try {
            nameMap = productClient.getProductNames(productIds);
        } catch (Exception e) {
            System.err.println("Warning: batch name fetch failed, names will show as Unknown. " + e.getMessage());
        }
        final Map<String, String> finalNameMap = nameMap;

        // ─── STEP 4: Process in-memory — no DB/HTTP in this loop ─────────────
        List<ForecastResultDto> report   = new ArrayList<>();
        List<Inventory>         toUpdate = applyChanges ? new ArrayList<>() : null;

        for (Inventory product : products) {
            Map<Integer, Integer> salesHistory =
                salesByProduct.getOrDefault(product.getProductId(), Collections.emptyMap());

            String prettyName = finalNameMap.getOrDefault(
                product.getProductId(), "Unknown (" + product.getProductId() + ")"
            );

            if (salesHistory.isEmpty()) {
                report.add(ForecastResultDto.builder()
                    .productId(product.getProductId())
                    .productName(prettyName)
                    .status("NO_DATA")
                    .build());
                continue;
            }

            // Train regression
            SimpleRegression regression = new SimpleRegression();
            for (Map.Entry<Integer, Integer> entry : salesHistory.entrySet()) {
                regression.addData(entry.getKey(), entry.getValue());
            }

            double predictedSales = regression.predict(31);
            if (Double.isNaN(predictedSales) || predictedSales < 0) predictedSales = 0.0;

            int newSafetyLevel = Math.max(5, (int) Math.ceil(predictedSales * 7 * 1.1));

            double slope = regression.getSlope();
            if (Double.isNaN(slope)) slope = 0.0;

            String slopeStr = String.format("%.2f", slope);
            String label, recommendation;

            if (slope >= 0.5) {
                label          = "HIGH VELOCITY (Surging Demand)";
                recommendation = String.format(
                    "Linear Regression analysis detects a steep positive slope (Slope=%s). " +
                    "Sales Velocity is accelerating rapidly. " +
                    "RECOMMENDATION: Immediately expand Safety Stock coverage to mitigate high Stockout Risk.",
                    slopeStr);
            } else if (slope >= 0.15) {
                label          = "POSITIVE TREND (Growing)";
                recommendation = String.format(
                    "Demand trend exhibits a moderate upward trajectory (Slope=%s). " +
                    "RECOMMENDATION: Incrementally adjust Safety Stock levels to preemptively accommodate projected near-term demand.",
                    slopeStr);
            } else if (slope > -0.15) {
                label          = "STABLE (Equilibrium)";
                recommendation = String.format(
                    "Demand volatility is low (Slope=%s), indicating Market Equilibrium. " +
                    "RECOMMENDATION: Maintain current inventory levels to optimize Holding Costs and capital efficiency.",
                    slopeStr);
            } else {
                label          = "DECLINING (Cooling Down)";
                recommendation = String.format(
                    "The model detects a significant cooling signal (Slope=%s). " +
                    "RECOMMENDATION: Halt replenishment orders and activate Clearance strategies to minimize Dead Stock accumulation.",
                    slopeStr);
            }

            String status;
            if (applyChanges) {
                product.setSafetyStockLevel(newSafetyLevel);
                product.setLastTrendSlope(slope);
                product.setLastForecastDate(LocalDateTime.now());
                toUpdate.add(product);
                status = "UPDATED";
            } else {
                status = product.getSafetyStockLevel().equals(newSafetyLevel)
                    ? "STABLE" : "UPDATE_NEEDED";
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

        if (applyChanges && !toUpdate.isEmpty()) {
            inventoryRepo.saveAll(toUpdate); 
        }

        return report;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void scheduledJob() {
        trainAndPredict(true, null); 
        System.out.println("Scheduled AI Forecast Job Completed.");
    }
}