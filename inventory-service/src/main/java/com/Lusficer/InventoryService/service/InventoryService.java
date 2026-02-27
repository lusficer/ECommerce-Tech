package com.Lusficer.InventoryService.service;

import com.Lusficer.InventoryService.entity.*;
import com.Lusficer.InventoryService.repository.*;
import com.Lusficer.InventoryService.dto.response.InventoryResponse;
import com.Lusficer.InventoryService.dto.request.StockRequest; 

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List; 
import java.util.Map; 
import java.util.stream.Collectors;

@Service
public class InventoryService {

    @Autowired private InventoryRepository inventoryRepo;
    @Autowired private ReservationRepository reservationRepo;
    @Autowired private StockLogRepository logRepo; 

    // 1. Giữ hàng (RESERVE)
    @Transactional
    public boolean reserveStock(String productId, int quantity, String orderId) {
        Inventory inventory = inventoryRepo.findByProductIdLocked(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int available = inventory.getQuantity() - inventory.getReservedQuantity();

        if (available < quantity) {
            throw new RuntimeException("Out of stock");
        }

        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventoryRepo.save(inventory);

        InventoryReservation res = InventoryReservation.builder()
                .orderId(orderId)
                .productId(productId)
                .quantity(quantity)
                .expiryTime(LocalDateTime.now().plusMinutes(15)) 
                .build();
        reservationRepo.save(res);
        
        saveLog(productId, orderId, StockLog.LogType.RESERVE, quantity, inventory.getQuantity(), "Giữ hàng cho đơn " + orderId);
        return true;
    }

    // 2. Chốt đơn (CONFIRM_SALE)
    @Transactional
    public void confirmSale(String orderId) {
        List<InventoryReservation> reservations = reservationRepo.findByOrderId(orderId);
        if (reservations.isEmpty()) return;

        for (InventoryReservation res : reservations) {
            Inventory inventory = inventoryRepo.findByProductIdLocked(res.getProductId()).orElseThrow();

            inventory.setQuantity(inventory.getQuantity() - res.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() - res.getQuantity());
            
            inventoryRepo.save(inventory);
            reservationRepo.delete(res);

            saveLog(res.getProductId(), orderId, StockLog.LogType.CONFIRM_SALE, -res.getQuantity(), inventory.getQuantity(), "Đã bán");
        }
    }

    // 3. Nhả hàng (RELEASE)
    @Transactional
    public void releaseStock(String orderId) {
        List<InventoryReservation> reservations = reservationRepo.findByOrderId(orderId);
        for (InventoryReservation res : reservations) {
            Inventory inventory = inventoryRepo.findByProductIdLocked(res.getProductId()).orElse(null);
            
            if (inventory != null) {
                inventory.setReservedQuantity(inventory.getReservedQuantity() - res.getQuantity());
                inventoryRepo.save(inventory);
                
                saveLog(res.getProductId(), orderId, StockLog.LogType.RELEASE, res.getQuantity(), inventory.getQuantity(), "Hủy đơn - Nhả hàng");
            }
            reservationRepo.delete(res);
        }
    }

    // [FIX] Thêm hàm này để Controller gọi không bị lỗi
    public Integer getAvailableStock(String productId) {
        Inventory i = inventoryRepo.findByProductId(productId).orElse(null);
        if (i == null) return 0;
        return i.getQuantity() - i.getReservedQuantity();
    }

    @Transactional
    public Map<String, Integer> getStockStatus(List<String> productIds) {
        // 1. Query Database 1 lần duy nhất (Batch Query)
        List<Inventory> inventories = inventoryRepo.findByProductIdIn(productIds);

        // 2. Chuyển List thành Map<ProductId, Quantity>
        Map<String, Integer> stockMap = inventories.stream()
                .collect(Collectors.toMap(
                        Inventory::getProductId,
                        // Lưu ý: Ở đây trả về số lượng CÓ THỂ BÁN (Available) hay TỔNG TỒN (Physical)?
                        // Để tạo hiệu ứng FOMO chuẩn, ta nên dùng (Quantity - Reserved)
                        i -> i.getQuantity() - i.getReservedQuantity()
                ));

        // 3. Những sản phẩm ID có trong list yêu cầu nhưng không có trong DB
        // (nghĩa là chưa nhập kho bao giờ), ta gán bằng 0.
        for (String id : productIds) {
            stockMap.putIfAbsent(id, 0);
        }

        return stockMap;
    }

    // Xem chi tiết
    public InventoryResponse getInventoryDetail(String productId) {
        Inventory i = inventoryRepo.findByProductId(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        return InventoryResponse.builder()
                .productId(i.getProductId())
                .sku(i.getSku()) // Entity đã thêm sku nên dòng này hết lỗi
                .totalQuantity(i.getQuantity())
                .reservedQuantity(i.getReservedQuantity())
                .availableQuantity(i.getQuantity() - i.getReservedQuantity())
                .safetyStockLevel(i.getSafetyStockLevel()) // Entity đã thêm nên hết lỗi
                .build();
    }

    // [FIX] Thêm hàm saveLog để các hàm trên gọi không bị lỗi
    private void saveLog(String pId, String oId, StockLog.LogType type, int amount, int currentStock, String note) {
        StockLog log = StockLog.builder()
                .productId(pId)
                .orderId(oId)
                .type(type)
                .changeAmount(amount)
                .currentStock(currentStock)
                .note(note)
                .build();
        logRepo.save(log);
    }
}