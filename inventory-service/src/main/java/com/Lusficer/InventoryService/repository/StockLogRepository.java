package com.Lusficer.InventoryService.repository;

import com.Lusficer.InventoryService.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findByProductIdOrderByCreatedAtDesc(String productId);

    // Adjust column names in SQL to match DB (changeAmount, createdAt, productId)
    @Query(value = "SELECT DATEDIFF(CURRENT_DATE, s.createdAt) as dayIndex, SUM(ABS(s.changeAmount)) as total " +
               "FROM STOCK_LOG s " +
               "WHERE s.productId = :productId " +
               "AND s.type = 'CONFIRM_SALE' " +
               "AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) " +
               "GROUP BY dayIndex", nativeQuery = true)
    List<Object[]> getRawDailySales(@Param("productId") String productId);

    default Map<Integer, Integer> getDailySalesLast30Days(String productId) {
        List<Object[]> rawData = getRawDailySales(productId);
        Map<Integer, Integer> result = new HashMap<>();
        
        for (Object[] row : rawData) {
            Number day = (Number) row[0];   
            Number qty = (Number) row[1];
            
            if (day != null && qty != null) {
                result.put(30 - day.intValue(), qty.intValue()); 
            }
        }
        return result;
    }
}