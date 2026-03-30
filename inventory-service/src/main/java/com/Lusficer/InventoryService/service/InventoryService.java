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

    /**
     * Reserves stock for an order with 15-minute expiry.
     * Validates available quantity before reservation.
     */
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
        
        saveLog(productId, orderId, StockLog.LogType.RESERVE, quantity, inventory.getQuantity(), "Reserve stock for order " + orderId);
        return true;
    }

    /**
     * Confirms sale and deducts reserved stock from inventory.
     * Removes reservation records after confirmation.
     */
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

            saveLog(res.getProductId(), orderId, StockLog.LogType.CONFIRM_SALE, -res.getQuantity(), inventory.getQuantity(), "Sold");
        }
    }

    /**
     * Releases reserved stock back to available inventory.
     * Called when order is cancelled or payment fails.
     */
    @Transactional
    public void releaseStock(String orderId) {
        List<InventoryReservation> reservations = reservationRepo.findByOrderId(orderId);
        for (InventoryReservation res : reservations) {
            Inventory inventory = inventoryRepo.findByProductIdLocked(res.getProductId()).orElse(null);
            
            if (inventory != null) {
                inventory.setReservedQuantity(inventory.getReservedQuantity() - res.getQuantity());
                inventoryRepo.save(inventory);
                
                saveLog(res.getProductId(), orderId, StockLog.LogType.RELEASE, res.getQuantity(), inventory.getQuantity(), "Order cancelled - Release stock");
            }
            reservationRepo.delete(res);
        }
    }

    /**
     * Updates total stock quantity for a product.
     * Creates new inventory record if doesn't exist.
     */
    @Transactional
public void updateStock(String productId, int newQuantity) {
    Inventory inventory = inventoryRepo.findByProductId(productId).orElse(null);
    if (inventory == null) {
        inventory = new Inventory();
        inventory.setProductId(productId);
        inventory.setSku("SKU-" + productId.substring(0, Math.min(8, productId.length())));
        inventory.setQuantity(newQuantity);
        inventory.setReservedQuantity(0);
        inventory.setSafetyStockLevel(10); 
    } else {
        inventory.setQuantity(newQuantity);
    }
    inventoryRepo.save(inventory);
}

    /**
     * Gets available stock quantity (total - reserved).
     */
    public Integer getAvailableStock(String productId) {
        Inventory i = inventoryRepo.findByProductId(productId).orElse(null);
        if (i == null) return 0;
        return i.getQuantity() - i.getReservedQuantity();
    }

    /**
     * Retrieves stock status for multiple products.
     */
    @Transactional
    public Map<String, Integer> getStockStatus(List<String> productIds) {
        List<Inventory> inventories = inventoryRepo.findByProductIdIn(productIds);

        Map<String, Integer> stockMap = inventories.stream()
                .collect(Collectors.toMap(
                        Inventory::getProductId,
                        i -> i.getQuantity() - i.getReservedQuantity()
                ));

        for (String id : productIds) {
            stockMap.putIfAbsent(id, 0);
        }

        return stockMap;
    }

    public InventoryResponse getInventoryDetail(String productId) {
        Inventory i = inventoryRepo.findByProductId(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        return InventoryResponse.builder()
                .productId(i.getProductId())
                .sku(i.getSku())
                .totalQuantity(i.getQuantity())
                .reservedQuantity(i.getReservedQuantity())
                .availableQuantity(i.getQuantity() - i.getReservedQuantity())
                .safetyStockLevel(i.getSafetyStockLevel())
                .build();
    }

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