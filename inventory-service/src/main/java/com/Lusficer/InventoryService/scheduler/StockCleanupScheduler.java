package com.Lusficer.InventoryService.scheduler;

import com.Lusficer.InventoryService.entity.*;
import com.Lusficer.InventoryService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class StockCleanupScheduler {

    @Autowired private InventoryRepository inventoryRepo;
    @Autowired private ReservationRepository reservationRepo;
    @Autowired private StockLogRepository logRepo; 

    // Chạy mỗi 1 phút một lần
   @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredStock() {
        List<InventoryReservation> expiredList = reservationRepo.findByExpiryTimeBefore(LocalDateTime.now());

        for (InventoryReservation res : expiredList) {
            Inventory inventory = inventoryRepo.findByProductIdLocked(res.getProductId()).orElse(null);
            
            if (inventory != null) {
                inventory.setReservedQuantity(inventory.getReservedQuantity() - res.getQuantity());
                inventoryRepo.save(inventory);
                
                // [NEW] Ghi log hệ thống tự quét
                StockLog log = StockLog.builder()
                        .productId(res.getProductId())
                        .orderId(res.getOrderId())
                        .type(StockLog.LogType.RELEASE)
                        .changeAmount(res.getQuantity())
                        .currentStock(inventory.getQuantity())
                        .note("System Auto Release (Expired)")
                        .build();
                logRepo.save(log);
            }
            reservationRepo.delete(res);
        }
    }
}