package com.Lusficer.FulfillmentService.service;

import com.Lusficer.FulfillmentService.client.InventoryClient;
import com.Lusficer.FulfillmentService.client.ProductClient;
import com.Lusficer.FulfillmentService.dto.*;
import com.Lusficer.FulfillmentService.entity.*;
import com.Lusficer.FulfillmentService.repository.ShipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
public class FulfillmentService {

    @Autowired private ShipmentRepository shipmentRepo;
    // @Autowired private ProductClient productClient;
    // @Autowired private PdfLabelService pdfLabelService;
    @Autowired private InventoryClient inventoryClient;
    // --- VENDOR LOGIC ---

    // 1. Tạo đơn Fulfillment (Gọi từ Order Service)
    @Transactional
    public Shipment createShipment(CreateShipmentRequest req) {
        Shipment s = new Shipment();
        s.setShipmentId("SHP-" + UUID.randomUUID().toString().substring(0, 8));
        s.setOrderId(req.getOrderId());
        s.setShopId(req.getShopId());
        s.setVendorId(req.getVendorId());
        
        s.setItems(new ArrayList<>());
        for (CreateShipmentRequest.ItemDto itemDto : req.getItems()) {
            ShipmentItem item = new ShipmentItem();
            item.setShipment(s);
            item.setProductId(itemDto.getProductId());
            item.setProductName(itemDto.getProductName());
            item.setQuantity(itemDto.getQuantity());
            s.getItems().add(item);
        }
        return shipmentRepo.save(s);
    }

    // 2. Start Picking
    public void startPicking(String shipmentId) {
        Shipment s = getShipment(shipmentId);
        s.setStatus(ShipmentStatus.PICKING);
        shipmentRepo.save(s);
    }

    // 3. Pack & Gen PDF
    // Trong FulfillmentService.java
    @Transactional
    public Shipment packAndLabel(String shipmentId) { // Đổi kiểu trả về
        Shipment s = getShipment(shipmentId);
        
        // 1. Cập nhật trạng thái
        s.setStatus(ShipmentStatus.PACKED);
        s.setPackedAt(LocalDateTime.now());
        
        // 2. Thay vì tạo PDF thật, ta tạo một cái Link giả (hoặc Link QR Code online)
        // Ví dụ dùng API tạo QR code miễn phí của Google/goqr
        String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + shipmentId;
        s.setLabelUrl(qrCodeUrl);
        
        // 3. Lưu và trả về đối tượng Shipment
        return shipmentRepo.save(s);
    }

    // 4. Handover
    public void handover(String shipmentId) {
        Shipment s = getShipment(shipmentId);
        s.setStatus(ShipmentStatus.HANDED_OVER);
        shipmentRepo.save(s);
    }

    // --- WAREHOUSE LOGIC ---

    // 5. Receive
    public void receiveAtWarehouse(String shipmentId) {
        Shipment s = getShipment(shipmentId);
        if (s.getStatus() != ShipmentStatus.HANDED_OVER) {
            throw new RuntimeException("Invalid status for receiving");
        }
        s.setStatus(ShipmentStatus.RECEIVED_AT_WAREHOUSE);
        s.setWarehouseReceivedAt(LocalDateTime.now());
        shipmentRepo.save(s);
    }

    // 6. Verify (Smart Check)
    public void verifyShipment(String shipmentId, VerificationResultDTO result) {
        Shipment s = getShipment(shipmentId);
        
        boolean hasError = false;
        for (ShipmentItem item : s.getItems()) {
            Boolean passed = result.getItemResults().get(item.getProductId());
            item.setVerified(passed != null && passed);
            if (!item.isVerified()) hasError = true;
        }

        if (hasError) {
            s.setStatus(ShipmentStatus.ISSUE_REPORTED); // Trigger Issue Flow
        } else {
            s.setStatus(ShipmentStatus.VERIFIED);
        }
        shipmentRepo.save(s);
    }

    // 7. Dispatch (Smart Inventory Sync)
    @Transactional
    public void dispatch(String shipmentId) {
        Shipment s = getShipment(shipmentId);
        
        // Check trạng thái
        if (s.getStatus() != ShipmentStatus.VERIFIED) {
            // Tùy logic, có thể cho phép dispatch từ trạng thái RECEIVED_AT_WAREHOUSE luôn
             throw new RuntimeException("Shipment must be VERIFIED before dispatch");
        }

        // === [UPDATED] SMART MANAGEMENT INTEGRATION ===
        // Thay vì gọi Product Service trừ từng món, ta gọi Inventory Service chốt đơn.
        
        try {
            // Gọi 1 lần duy nhất cho cả đơn hàng
            inventoryClient.confirmSale(s.getOrderId());
            
            System.out.println("Inventory confirmed for Order: " + s.getOrderId());
            
        } catch (Exception e) {
            System.err.println("Error calling INVENTORY SERVICE: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to confirm inventory for order " + s.getOrderId() + ": " + e.getMessage(), e);
        }

        // Cập nhật trạng thái
        s.setStatus(ShipmentStatus.DISPATCHED);
        s.setDispatchedAt(LocalDateTime.now());
        shipmentRepo.save(s);
    }
    private Shipment getShipment(String id) {
        return shipmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Shipment not found"));
    }
}