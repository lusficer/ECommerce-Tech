package com.Lusficer.StatisticsService.service;

import com.Lusficer.StatisticsService.dto.*;
import com.Lusficer.StatisticsService.entity.*;
import com.Lusficer.StatisticsService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class StatisticsService {

    @Autowired private DailySalesRepository dailySalesRepo;
    @Autowired private ProductSalesRepository productSalesRepo;


    public List<DailySalesDto> getPlatformRevenue(LocalDate start, LocalDate end) {
        return dailySalesRepo.getPlatformRevenueStats(start, end);
    }

    public List<DailySalesStats> getShopRevenue(String shopId, LocalDate start, LocalDate end) {
        return dailySalesRepo.findByShopIdAndDateBetweenOrderByDateAsc(shopId, start, end);
    }

    public List<ProductSalesStats> getTopProductsByShop(String shopId) {
        return productSalesRepo.findTop10ByShopIdOrderByTotalSoldDesc(shopId);
    }

    
    @Transactional
    public void recordOrderCompletion(String shopId, BigDecimal amount, List<ProductItemDto> items, LocalDate orderDate) {
        LocalDate targetDate = (orderDate != null) ? orderDate : LocalDate.now();

        DailySalesStats dailyStats = dailySalesRepo.findByShopIdAndDate(shopId, targetDate)
                .orElse(DailySalesStats.builder()
                        .shopId(shopId)
                        .date(targetDate) 
                        .totalRevenue(BigDecimal.ZERO)
                        .totalOrders(0)
                        .totalItemsSold(0)
                        .cancelledOrders(0)
                        .build());

        dailyStats.setTotalRevenue(dailyStats.getTotalRevenue().add(amount));
        dailyStats.setTotalOrders(dailyStats.getTotalOrders() + 1);
        
        if (items != null) {
            int itemCount = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();
            dailyStats.setTotalItemsSold(dailyStats.getTotalItemsSold() + itemCount);
        }
        dailySalesRepo.save(dailyStats);

        for (ProductItemDto item : items) {
            ProductSalesStats prodStats = productSalesRepo.findByProductId(item.getProductId())
                    .orElse(ProductSalesStats.builder()
                            .productId(item.getProductId())
                            .shopId(shopId)
                            .productName(item.getProductName() != null ? item.getProductName() : "Unknown Product")
                            .totalSold(0)
                            .totalRevenue(BigDecimal.ZERO)
                            .build());

            prodStats.setTotalSold(prodStats.getTotalSold() + item.getQuantity());
            prodStats.setTotalRevenue(prodStats.getTotalRevenue().add(item.getSubTotal()));
            prodStats.setLastSoldAt(LocalDateTime.now()); 
            
            productSalesRepo.save(prodStats);
        }
    }
    
  
}