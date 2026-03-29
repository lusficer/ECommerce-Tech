package com.Lusficer.InventoryService.repository;

import com.Lusficer.InventoryService.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface StockLogRepository extends JpaRepository<StockLog, Long> {

    // ─────────────────────────────────────────────────────────────────────────
    // OLD (N+1 — DO NOT USE in forecast loop):
    //   Map<Integer, Integer> getDailySalesLast30Days(String productId)
    //   → called inside for-each = ~1300 separate SQL queries
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * BULK replacement — single query returns daily sales for ALL products.
     *
     * Returns List of Object[3]: [productId (String), dayOfMonth (Integer), totalQty (Integer)]
     *
     * Usage in service:
     *   Map<String, Map<Integer,Integer>> allSales = bulkGetDailySalesLast30Days(since)
     *       .stream()
     *       .collect(groupingBy(row -> (String) row[0],
     *                toMap(row -> (Integer) row[1], row -> (Integer) row[2])));
     */
    @Query(value = """
        SELECT
            sl.productId                            AS productId,
            DAY(sl.createdAt)                       AS dayOfMonth,
            SUM(ABS(sl.changeAmount))               AS totalQty
        FROM STOCK_LOG sl
        WHERE sl.type = 'CONFIRM_SALE'
          AND sl.createdAt >= :since
        GROUP BY sl.productId, DAY(sl.createdAt)
        """, nativeQuery = true)
    List<Object[]> bulkGetDailySalesLast30Days(@Param("since") LocalDateTime since);

    
}