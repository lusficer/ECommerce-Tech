package com.Lusficer.StatisticsService.repository;

import com.Lusficer.StatisticsService.dto.DailySalesDto;
import com.Lusficer.StatisticsService.entity.DailySalesStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailySalesRepository extends JpaRepository<DailySalesStats, Long> {

    Optional<DailySalesStats> findByShopIdAndDate(String shopId, LocalDate date);

    List<DailySalesStats> findByShopIdAndDateBetweenOrderByDateAsc(String shopId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT new com.Lusficer.StatisticsService.dto.DailySalesDto(d.date, SUM(d.totalRevenue), SUM(d.totalOrders)) " +
           "FROM DailySalesStats d " +
           "WHERE d.date BETWEEN :startDate AND :endDate " +
           "GROUP BY d.date " +
           "ORDER BY d.date ASC")
    List<DailySalesDto> getPlatformRevenueStats(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}