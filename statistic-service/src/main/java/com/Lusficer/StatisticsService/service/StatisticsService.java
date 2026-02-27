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

    // --- READ OPERATIONS (API) ---

    // 1. Cho Manager: Xem biểu đồ doanh thu toàn sàn
    public List<DailySalesDto> getPlatformRevenue(LocalDate start, LocalDate end) {
        return dailySalesRepo.getPlatformRevenueStats(start, end);
    }

    // 2. Cho Vendor: Xem biểu đồ doanh thu của Shop mình
    public List<DailySalesStats> getShopRevenue(String shopId, LocalDate start, LocalDate end) {
        return dailySalesRepo.findByShopIdAndDateBetweenOrderByDateAsc(shopId, start, end);
    }

    // 3. Cho Vendor: Xem top sản phẩm
    public List<ProductSalesStats> getTopProductsByShop(String shopId) {
        return productSalesRepo.findTop10ByShopIdOrderByTotalSoldDesc(shopId);
    }

    // --- WRITE OPERATIONS (Xử lý sự kiện từ Order Service) ---
    // Hàm này sẽ được gọi khi Order Service bắn Event "Order Completed" sang
    
    @Transactional
    public void recordOrderCompletion(String shopId, BigDecimal amount, List<ProductItemDto> items) {
        LocalDate today = LocalDate.now();

        // A. Cập nhật Doanh thu ngày (Daily Sales)
        DailySalesStats dailyStats = dailySalesRepo.findByShopIdAndDate(shopId, today)
                .orElse(DailySalesStats.builder()
                        .shopId(shopId)
                        .date(today)
                        .totalRevenue(BigDecimal.ZERO)
                        .totalOrders(0)
                        .totalItemsSold(0)
                        .cancelledOrders(0)
                        .build());

        // Cộng dồn
        dailyStats.setTotalRevenue(dailyStats.getTotalRevenue().add(amount));
        dailyStats.setTotalOrders(dailyStats.getTotalOrders() + 1);
        
        if (items != null) {
            int itemCount = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum();
            dailyStats.setTotalItemsSold(dailyStats.getTotalItemsSold() + itemCount);
        }
        dailySalesRepo.save(dailyStats);

        // B. Cập nhật Thống kê Sản phẩm (Product Stats)
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