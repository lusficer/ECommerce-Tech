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
import com.Lusficer.OrderService.exception.BadRequestException;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.repository.OrderTrackingRepository;

import feign.FeignException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderTrackingRepository trackingRepository;
    @Autowired private StatisticsClient statisticsClient;   
    @Autowired private InventoryClient inventoryClient;
    @Autowired private VNPayService vnPayService;

    /**
     * Places a new order with inventory reservation.
     * Generates payment URL for VNPAY method.
     * Orders over 2000 require manager verification.
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> placeOrder(PlaceOrderRequest request, HttpServletRequest httpRequest) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BigDecimal subTotal = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        
        Order order = new Order();
        order.setOrderId(orderId);

        for (OrderItemRequest itemReq : request.getItems()) {
            try {
                StockRequest stockReq = new StockRequest(orderId, itemReq.getProductId(), itemReq.getQuantity());
                inventoryClient.reserveStock(stockReq);
                
            } catch (FeignException e) {
                System.err.println("Inventory Error: " + e.contentUTF8());
                throw new InvalidOrderOperationException("Đặt hàng thất bại: Sản phẩm " + itemReq.getProductName() + " đã hết hàng hoặc không đủ số lượng.");
            } catch (Exception e) {
                throw new RuntimeException("Hệ thống kho đang bận, vui lòng thử lại sau.");
            }

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

        BigDecimal shippingFee = new BigDecimal("5"); 
        BigDecimal grandTotal = subTotal.add(shippingFee);

        order.setUserId(request.getUserId());
        order.setShopId(request.getShopId());
        order.setSubTotal(subTotal);
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setGrandTotal(grandTotal);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(PaymentStatus.PENDING);
        
        if (grandTotal.compareTo(new BigDecimal("2000")) > 0) {
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

        String paymentUrl = null;
        if ("VNPAY".equalsIgnoreCase(request.getPaymentMethod())) {
            paymentUrl = vnPayService.createPaymentUrl(savedOrder.getOrderId(), savedOrder.getGrandTotal(), httpRequest, savedOrder.getShopId());      
        }

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", savedOrder.getOrderId());
        response.put("paymentUrl", paymentUrl);
        return response;
    }

    /**
     * Processes VNPay payment callback.
     * Updates order payment status and releases inventory on failure.
     */
    @Transactional
    public String processVNPayReturn(Map<String, String> params) {
        String orderId = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        
        boolean isValid = vnPayService.verifyPayment(params);
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!isValid) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            return "signature_failed";
        }

        if ("00".equals(responseCode)) {
            order.setPaymentStatus(PaymentStatus.PAID); 
            orderRepository.save(order);
            createTrackingLog(order, "Payment Success", "Customer paid via VNPay successfully.", "PENDING", null, null);
            return "success";
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            
            try {
                inventoryClient.releaseStock(orderId);
                System.out.println("Stock released for unpaid order: " + orderId);
            } catch (Exception e) {
                System.err.println("Warning: Failed to release stock for order " + orderId);
            }

            createTrackingLog(order, "Payment Failed", "Transaction cancelled or failed.", "PENDING", null, null);
            return "payment_failed";
        }
    }

    /**
     * Cancels an order and releases reserved inventory.
     * Only NEW or PENDING_VERIFICATION orders can be cancelled.
     */
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

        try {
            inventoryClient.releaseStock(orderId);
            System.out.println("Stock released for cancelled order: " + orderId);
        } catch (Exception e) {
            System.err.println("Warning: Failed to release stock manually for order " + orderId + ". Reason: " + e.getMessage());
        }

        String existingShipmentId = getExistingShipmentId(orderId);
        createTrackingLog(savedOrder, "Order Cancelled", "Buyer cancelled this order", existingShipmentId, null, null);
    }

    /**
     * Completes a delivered order and syncs statistics.
     * Only DELIVERED orders can be completed by customer.
     */
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
                savedOrder.getUpdatedAt().toLocalDate(),
                itemDtos
            );
            statisticsClient.syncOrder(event);
        } catch (Exception e) {
            System.err.println("Failed to sync statistics: " + e.getMessage());
        }
        return savedOrder;
    }

    /**
     * Updates order status by vendor.
     * Generates shipment ID and tracking info for SHIPPING status.
     */
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

        String shipmentId = getExistingShipmentId(orderId);
        
        if ("PENDING".equals(shipmentId) && newStatus == OrderStatus.SHIPPING) {
            shipmentId = "SHP-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String description = "Status changed from " + oldStatus + " to " + newStatus;
        String trackingNumber = null;
        String carrier = null;

        if (newStatus == OrderStatus.SHIPPING) {
            trackingNumber = "GHTK-" + System.currentTimeMillis();
            carrier = "Giao Hang Tiet Kiem";
            description = "Order handed over to carrier";
        }

        createTrackingLog(savedOrder, newStatus.toString(), description, shipmentId, trackingNumber, carrier);
        return savedOrder;
    }

    /**
     * Verifies high-value order by manager.
     * Approves or rejects orders in PENDING_VERIFICATION status.
     */
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

    /**
     * Retrieves last valid shipment ID from tracking history.
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
     * Creates tracking log entry for order status changes.
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