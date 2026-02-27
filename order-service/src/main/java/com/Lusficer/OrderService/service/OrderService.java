// File: src/main/java/com/Lusficer/OrderService/service/OrderService.java
package com.Lusficer.OrderService.service;

import com.Lusficer.OrderService.client.InventoryClient;
import com.Lusficer.OrderService.client.StatisticsClient;
import com.Lusficer.OrderService.dto.request.*;
import com.Lusficer.OrderService.entity.*;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.enums.PaymentStatus;
import com.Lusficer.OrderService.exception.InvalidOrderOperationException;
import com.Lusficer.OrderService.exception.ResourceNotFoundException;
import com.Lusficer.OrderService.exception.UnauthorizedAccessException;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.repository.OrderTrackingRepository;

import feign.FeignException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderTrackingRepository trackingRepository;
    @Autowired private StatisticsClient statisticsClient;   
    @Autowired private InventoryClient inventoryClient;
    // --- LOGIC FOR USER ---

    @Transactional(rollbackFor = Exception.class) // Đảm bảo rollback nếu lỗi kho
    public Order placeOrder(PlaceOrderRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Calculate prices
        BigDecimal subTotal = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        
        // Create temporary Order object
        Order order = new Order();
        order.setOrderId(orderId);

        // [NEW] LOGIC GIỮ HÀNG (RESERVE)
        // Duyệt qua từng sản phẩm để tính tiền VÀ giữ chỗ bên kho
        for (OrderItemRequest itemReq : request.getItems()) {
            
            // --- A. Gọi Inventory giữ hàng ---
            try {
                // Tạo request giữ hàng
                StockRequest stockReq = new StockRequest(orderId, itemReq.getProductId(), itemReq.getQuantity());
                
                // Gọi sang Inventory Service (Nếu hết hàng -> Feign ném lỗi 400/500 -> Catch ở dưới)
                inventoryClient.reserveStock(stockReq);
                
            } catch (FeignException e) {
                // Phân tích lỗi từ Inventory trả về để báo cho User dễ hiểu hơn
                System.err.println("Inventory Error: " + e.contentUTF8());
                throw new InvalidOrderOperationException("Đặt hàng thất bại: Sản phẩm " + itemReq.getProductName() + " đã hết hàng hoặc không đủ số lượng.");
            } catch (Exception e) {
                // Lỗi mạng hoặc lỗi hệ thống khác
                throw new RuntimeException("Hệ thống kho đang bận, vui lòng thử lại sau.");
            }

            // --- B. Tính toán giá cả (Logic cũ) ---
            BigDecimal lineTotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subTotal = subTotal.add(lineTotal);

            items.add(OrderItem.builder()
                    .order(order)
                    .productId(itemReq.getProductId())
                    .productName(itemReq.getProductName())
                    .productImage(itemReq.getProductImage())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(lineTotal)
                    .build());
        }

        // [LOGIC CŨ GIỮ NGUYÊN] ...
        BigDecimal shippingFee = new BigDecimal("30000"); 
        BigDecimal grandTotal = subTotal.add(shippingFee);

        order.setUserId(request.getUserId());
        order.setShopId(request.getShopId());
        order.setSubTotal(subTotal);
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setGrandTotal(grandTotal);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(PaymentStatus.PENDING);
        
        if (grandTotal.compareTo(new BigDecimal("50000000")) > 0) {
            order.setOrderStatus(OrderStatus.PENDING_VERIFICATION);
        } else {
            order.setOrderStatus(OrderStatus.NEW);
        }

        order.setOrderItems(items);

        OrderAddress address = OrderAddress.builder()
                .order(order)
                .fullName(request.getAddress().getFullName())
                .phone(request.getAddress().getPhone())
                .addressLine(request.getAddress().getAddressLine())
                .city(request.getAddress().getCity())
                .district(request.getAddress().getDistrict())
                .ward(request.getAddress().getWard())
                .build();
        order.setOrderAddress(address);

        Order savedOrder = orderRepository.save(order);

        createTrackingLog(savedOrder, "Order Created", "Waiting for seller confirmation", "PENDING", null, null);

        return savedOrder;
    }
    public void cancelOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId)); 

        if (!order.getUserId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to cancel this order."); 
        }
        
        if (order.getOrderStatus() != OrderStatus.NEW && order.getOrderStatus() != OrderStatus.PENDING_VERIFICATION) {
            throw new InvalidOrderOperationException("Cannot cancel order because it is in " + order.getOrderStatus() + " status.");
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // [NEW] LOGIC NHẢ HÀNG (RELEASE)
        // Khi hủy đơn, phải báo kho nhả hàng ra ngay
        try {
            inventoryClient.releaseStock(orderId);
            System.out.println("Stock released for cancelled order: " + orderId);
        } catch (Exception e) {
            System.err.println("Warning: Failed to release stock manually for order " + orderId + ". Reason: " + e.getMessage());
        }

        String existingShipmentId = getExistingShipmentId(orderId);
        createTrackingLog(savedOrder, "Order Cancelled", "Buyer cancelled this order", existingShipmentId, null, null);
    }

   public Order completeOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new InvalidOrderOperationException("Only DELIVERED orders can be completed.");
        }

        order.setOrderStatus(OrderStatus.COMPLETED);
        Order savedOrder = orderRepository.save(order);

        String existingShipmentId = getExistingShipmentId(orderId);
        createTrackingLog(savedOrder, "Order Completed", "Customer confirmed receipt", existingShipmentId, null, null);
        
        try {
            inventoryClient.confirmSale(orderId);
            System.out.println("✅ Inventory confirmed/deducted for order: " + orderId);
        } catch (Exception e) {
            // Log lỗi warning, không throw exception để chặn người dùng
            // Vì đơn đã hoàn thành rồi, nếu lỗi kho thì admin xử lý sau
            System.err.println("⚠️ Warning: Failed to confirm inventory for completed order: " + e.getMessage());
        }


        try {
            List<StatisticsClient.ProductItemDto> itemDtos = savedOrder.getOrderItems().stream()
                .map(item -> new StatisticsClient.ProductItemDto(
                    item.getProductId(),
                    item.getProductName(),
                    item.getQuantity(),
                    item.getTotalPrice()
                )).toList();

            StatisticsClient.OrderCompletedEvent event = new StatisticsClient.OrderCompletedEvent(
                savedOrder.getShopId(),
                savedOrder.getGrandTotal(),
                itemDtos
            );
            statisticsClient.syncOrder(event);
        } catch (Exception e) {
            System.err.println("Failed to sync statistics: " + e.getMessage());
        }
        return savedOrder;
    }

    // --- LOGIC FOR VENDOR ---

    public Order updateOrderStatus(String orderId, UpdateStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId)); // 404

        if (!order.getShopId().equals(request.getShopId())) {
            throw new UnauthorizedAccessException("This order belongs to another shop."); // 403
        }

        OrderStatus oldStatus = order.getOrderStatus();
        OrderStatus newStatus = OrderStatus.valueOf(request.getNewStatus());
        
        order.setOrderStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        // === [LOGIC SHIPMENT] ===
        // 1. Get existing ID
        String shipmentId = getExistingShipmentId(orderId);
        
        // 2. If ID is placeholder "PENDING" AND new status is SHIPPING -> Generate real ID
        if ("PENDING".equals(shipmentId) && newStatus == OrderStatus.SHIPPING) {
            shipmentId = "SHP-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String description = "Status changed from " + oldStatus + " to " + newStatus;
        String trackingNumber = null;
        String carrier = null;

        // Simulate generating tracking info
        if (newStatus == OrderStatus.SHIPPING) {
            trackingNumber = "GHTK-" + System.currentTimeMillis();
            carrier = "Giao Hang Tiet Kiem";
            description = "Order handed over to carrier";
        }

        createTrackingLog(savedOrder, newStatus.toString(), description, shipmentId, trackingNumber, carrier);
        return savedOrder;
    }

    // --- LOGIC FOR MANAGER ---

    public Order verifyOrder(String orderId, VerifyOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId)); // 404

        if (order.getOrderStatus() != OrderStatus.PENDING_VERIFICATION) {
            throw new InvalidOrderOperationException("Order is not in a state that requires verification."); // 400
        }

        String existingShipmentId = getExistingShipmentId(orderId);

        if (request.isApproved()) {
            order.setOrderStatus(OrderStatus.NEW);
            order.setIsVerified(true);
            order.setVerifiedBy(request.getManagerId());
            
            createTrackingLog(order, "Order Verified", "Manager approved the order", existingShipmentId, null, null);
        } else {
            order.setOrderStatus(OrderStatus.REJECTED);
            createTrackingLog(order, "Order Rejected", "Manager rejected. Reason: " + request.getReason(), existingShipmentId, null, null);
        }

        return orderRepository.save(order);
    }
    
    // --- HELPER METHODS ---

    /**
     * Helper to find the last valid Shipment ID from tracking history.
     * Returns "PENDING" if no ID found.
     */
    private String getExistingShipmentId(String orderId) {
        List<OrderTracking> logs = trackingRepository.findByOrder_OrderIdOrderByUpdatedAtDesc(orderId);
        if (!logs.isEmpty()) {
            String lastId = logs.get(0).getShipmentId();
            if (lastId != null && !lastId.isEmpty()) {
                return lastId;
            }
        }
        return "PENDING";
    }
    
    /**
     * Helper to save a new row in OrderTracking table
     */
    private void createTrackingLog(Order order, String displayStatus, String description, 
                                   String shipmentId, String trackingNumber, String carrierName) {
        OrderTracking tracking = OrderTracking.builder()
                .order(order)
                .displayStatus(displayStatus)
                .description(description)
                .updatedAt(LocalDateTime.now())
                .shipmentId(shipmentId)
                .trackingNumber(trackingNumber)
                .carrierName(carrierName)
                .build();
        trackingRepository.save(tracking);
    }
}