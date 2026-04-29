package com.Lusficer.OrderService.service;

import com.Lusficer.OrderService.client.InventoryClient;
import com.Lusficer.OrderService.client.DisputeInternalClient;
import com.Lusficer.OrderService.client.StatisticsClient;
import com.Lusficer.OrderService.client.ShopInternalClient;
import com.Lusficer.OrderService.client.UserInternalClient;
import com.Lusficer.OrderService.dto.request.*;
import com.Lusficer.OrderService.dto.response.VendorOrderShippingDTO;
import com.Lusficer.OrderService.dto.response.VerificationContextDTO;
import com.Lusficer.OrderService.dto.response.WarehouseInfoDTO;

import com.Lusficer.OrderService.entity.*;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.enums.PaymentStatus;
import com.Lusficer.OrderService.enums.ShippingStatus;
import com.Lusficer.OrderService.exception.InvalidOrderOperationException;
import com.Lusficer.OrderService.exception.ResourceNotFoundException;
import com.Lusficer.OrderService.exception.ForbiddenException;
import com.Lusficer.OrderService.exception.BadRequestException;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.repository.OrderTrackingRepository;
import com.Lusficer.OrderService.repository.ShippingRepository;
import feign.FeignException;

import com.Lusficer.OrderService.dto.response.ShipperBasicDTO;
import com.Lusficer.OrderService.dto.response.ShipperWithStatusDTO;
import com.Lusficer.OrderService.dto.response.ShippingResponseDTO;
import com.Lusficer.OrderService.repository.ShipperStatusRepository;
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
    @Autowired private UserInternalClient userInternalClient;
    @Autowired private DisputeInternalClient disputeInternalClient;
    @Autowired private ShopInternalClient shopInternalClient;
    @Autowired private ShippingRepository shippingRepository;
    @Autowired private NotificationHelper notificationHelper;
    @Autowired private ShipperStatusRepository shipperStatusRepository;

        private record FraudEval(
            boolean isNewAccount,
            long recentOrderCount,
            long recentCancelCount,
            boolean hasDisputeHistory,
            boolean addressMismatch,
            int fraudScore,
            String riskLevel
        ) {}

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
                throw new InvalidOrderOperationException("Order failed: Product " + itemReq.getProductName() + " is out of stock or insufficient quantity.");
            } catch (Exception e) {
                throw new RuntimeException("Inventory system is busy, please try again later.");
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

        // Notifications (best-effort, never break order flow)
        try {
            notificationHelper.notifyNewOrderReceived(savedOrder.getOrderId(), savedOrder.getShopId());
            if (savedOrder.getOrderStatus() == OrderStatus.PENDING_VERIFICATION) {
                notificationHelper.notifyOrderPendingVerification(savedOrder.getOrderId(), savedOrder.getShopId(), savedOrder.getGrandTotal());
            }
        } catch (Exception e) {
            System.err.println("Failed to send notifications for placeOrder: " + e.getMessage());
        }

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
            throw new ForbiddenException("You are not authorized to cancel this order."); 
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
            throw new ForbiddenException("Unauthorized");
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
            throw new ForbiddenException("This order belongs to another shop."); // 403
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
            carrier = "GHTK Express";
            description = "Order handed over to carrier";

            // Create a Shipping record and populate pickup (warehouse) info for shipper.
            Shipping shipping = shippingRepository.findByOrderId(orderId)
                    .orElseGet(() -> Shipping.builder().orderId(orderId).build());

            if (shipping.getStatus() == null) {
                shipping.setStatus(ShippingStatus.PICKING_UP);
            }

            try {
                WarehouseInfoDTO warehouse = shopInternalClient.getWarehouseInfo(order.getShopId());
                if (warehouse != null) {
                    shipping.setPickupAddress(warehouse.getWarehouseAddress());
                    shipping.setPickupCity(warehouse.getWarehouseCity());
                    shipping.setPickupDistrict(warehouse.getWarehouseDistrict());
                    shipping.setPickupWard(warehouse.getWarehouseWard());
                    shipping.setPickupPhone(warehouse.getWarehousePhone());
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch warehouse info: " + e.getMessage());
            }

            shippingRepository.save(shipping);
        }

        createTrackingLog(savedOrder, newStatus.toString(), description, shipmentId, trackingNumber, carrier);

        // Notifications (best-effort)
        try {
            notificationHelper.notifyOrderStatusChanged(savedOrder.getOrderId(), savedOrder.getUserId(), newStatus.name());
            if (newStatus == OrderStatus.SHIPPING) {
                notificationHelper.notifyOrderAvailableForShipping(savedOrder.getOrderId());
            }
        } catch (Exception e) {
            System.err.println("Failed to send notifications for updateOrderStatus: " + e.getMessage());
        }
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
            FraudEval fraudEval = evaluateFraudSignals(order);
            if ("HIGH".equalsIgnoreCase(fraudEval.riskLevel) && !Boolean.TRUE.equals(request.getRiskAcknowledged())) {
                throw new BadRequestException("HIGH risk order requires riskAcknowledged=true to approve.");
            }

            order.setOrderStatus(OrderStatus.NEW);
            order.setIsVerified(true);
            order.setVerifiedBy(request.getManagerId());
            
            createTrackingLog(order, "Order Verified", "Manager approved the order", existingShipmentId, null, null);

            try {
                notificationHelper.notifyOrderVerified(order.getOrderId(), order.getUserId());
            } catch (Exception e) {
                System.err.println("Failed to send ORDER_VERIFIED notification: " + e.getMessage());
            }
        } else {
            order.setOrderStatus(OrderStatus.REJECTED);
            createTrackingLog(order, "Order Rejected", "Manager rejected. Reason: " + request.getReason(), existingShipmentId, null, null);

            try {
                notificationHelper.notifyOrderRejected(order.getOrderId(), order.getUserId(), request.getReason());
            } catch (Exception e) {
                System.err.println("Failed to send ORDER_REJECTED notification: " + e.getMessage());
            }
        }

        return orderRepository.save(order);
    }

    /**
     * Returns verification context for managers to decide approve/reject.
     */
    public VerificationContextDTO getVerificationContext(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        String paymentRiskLevel = calculatePaymentRiskLevel(order);
        FraudEval fraudEval = evaluateFraudSignals(order);

        return VerificationContextDTO.builder()
                .orderId(order.getOrderId())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentRiskLevel(paymentRiskLevel)

                .isNewAccount(fraudEval.isNewAccount())
                .recentOrderCount(fraudEval.recentOrderCount())
                .recentCancelCount(fraudEval.recentCancelCount())
                .hasDisputeHistory(fraudEval.hasDisputeHistory())
                .addressMismatch(fraudEval.addressMismatch())
                .fraudScore(fraudEval.fraudScore())
                .riskLevel(fraudEval.riskLevel())

                .grandTotal(order.getGrandTotal())
                .items(order.getOrderItems() == null ? List.of() : order.getOrderItems().stream()
                        .map(i -> VerificationContextDTO.OrderItemSummaryDTO.builder()
                                .productId(i.getProductId())
                                .productName(i.getProductName())
                                .productImage(i.getProductImage())
                                .quantity(i.getQuantity())
                                .unitPrice(i.getUnitPrice())
                                .totalPrice(i.getTotalPrice())
                                .build())
                        .toList())
                .address(order.getOrderAddress() == null ? null : VerificationContextDTO.OrderAddressSummaryDTO.builder()
                        .fullName(order.getOrderAddress().getFullName())
                        .phone(order.getOrderAddress().getPhone())
                        .addressLine(order.getOrderAddress().getAddressLine())
                        .city(order.getOrderAddress().getCity())
                        .district(order.getOrderAddress().getDistrict())
                        .ward(order.getOrderAddress().getWard())
                        .build())
                .build();
    }

    private String calculatePaymentRiskLevel(Order order) {
        String method = order.getPaymentMethod() == null ? "" : order.getPaymentMethod();
        BigDecimal total = order.getGrandTotal() == null ? BigDecimal.ZERO : order.getGrandTotal();

        boolean isCod = "COD".equalsIgnoreCase(method);
        boolean isVnpay = "VNPAY".equalsIgnoreCase(method);

        if (isCod && total.compareTo(new BigDecimal("5000")) > 0) {
            return "HIGH";
        }
        if (isCod) {
            return "MEDIUM";
        }
        if (isVnpay && order.getPaymentStatus() == PaymentStatus.PAID) {
            return "LOW";
        }
        if (isVnpay && order.getPaymentStatus() != PaymentStatus.PAID) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private FraudEval evaluateFraudSignals(Order order) {
        String userId = order.getUserId();
        LocalDateTime now = LocalDateTime.now();

        boolean isNewAccount = false;
        try {
            LocalDateTime createdAt = userInternalClient.getUserCreatedAt(userId);
            if (createdAt != null) {
                isNewAccount = createdAt.isAfter(now.minusDays(7));
            }
        } catch (Exception e) {
            // ignore failures and treat as unknown/false
        }

        long recentOrderCount = 0;
        long recentCancelCount = 0;
        try {
            recentOrderCount = orderRepository.countByUserIdAndCreatedAtAfter(userId, now.minusHours(24));
            recentCancelCount = orderRepository.countByUserIdAndOrderStatusAndUpdatedAtAfter(userId, OrderStatus.CANCELLED, now.minusDays(30));
        } catch (Exception e) {
            // ignore
        }

        boolean hasDisputeHistory = false;
        try {
            Boolean exists = disputeInternalClient.userHasDispute(userId);
            hasDisputeHistory = Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            // ignore
        }

        boolean addressMismatch = false;
        try {
            Order lastOrder = orderRepository.findTopByUserIdAndOrderIdNotOrderByCreatedAtDesc(userId, order.getOrderId());
            String lastCity = lastOrder != null && lastOrder.getOrderAddress() != null ? lastOrder.getOrderAddress().getCity() : null;
            String currentCity = order.getOrderAddress() != null ? order.getOrderAddress().getCity() : null;
            if (lastCity != null && currentCity != null) {
                addressMismatch = !lastCity.equalsIgnoreCase(currentCity);
            }
        } catch (Exception e) {
            // ignore
        }

        int score = 0;
        if (isNewAccount) score += 30;
        if (recentOrderCount > 3) score += 20;
        if (recentCancelCount > 2) score += 15;
        if (hasDisputeHistory) score += 20;
        if (addressMismatch) score += 15;

        String method = order.getPaymentMethod() == null ? "" : order.getPaymentMethod();
        BigDecimal total = order.getGrandTotal() == null ? BigDecimal.ZERO : order.getGrandTotal();
        if ("COD".equalsIgnoreCase(method) && total.compareTo(new BigDecimal("5000")) > 0) {
            score += 20;
        }

        if (score > 100) score = 100;

        String riskLevel;
        if (score <= 30) riskLevel = "LOW";
        else if (score <= 60) riskLevel = "MEDIUM";
        else riskLevel = "HIGH";

        return new FraudEval(
                isNewAccount,
                recentOrderCount,
                recentCancelCount,
                hasDisputeHistory,
                addressMismatch,
                score,
                riskLevel
        );
    }

    // Lấy tất cả đơn của vendor (across tất cả shop)
    public List<Order> getOrdersByVendor(String vendorId, String status) {
        List<String> shopIds = shopInternalClient.getShopIdsByVendor(vendorId);
        if (shopIds.isEmpty()) return List.of();

        if (status != null && !status.isEmpty()) {
            return orderRepository.findByShopIdInAndOrderStatus(
                shopIds, OrderStatus.valueOf(status));
        }
        return orderRepository.findByShopIdInOrderByCreatedAtDesc(shopIds);
    }

    // Lấy đơn của 1 shop cụ thể, verify bằng shopIds list
    public List<Order> getOrdersByShopForVendor(String vendorId, String shopId, String status) {
        List<String> shopIds = shopInternalClient.getShopIdsByVendor(vendorId);
        if (!shopIds.contains(shopId)) {
            throw new ForbiddenException("You do not have permission to view orders for this shop.");
        }

        if (status != null && !status.isEmpty()) {
            return orderRepository.findByShopIdAndOrderStatus(
                shopId, OrderStatus.valueOf(status));
        }
        return orderRepository.findByShopIdOrderByCreatedAtDesc(shopId);
    }

    // Xem chi tiết đơn kèm shipper info
    public VendorOrderShippingDTO getOrderShippingInfoForVendor(String vendorId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        List<String> shopIds = shopInternalClient.getShopIdsByVendor(vendorId);
        if (!shopIds.contains(order.getShopId())) {
            throw new ForbiddenException("You do not have permission to view this order.");
        }

        Shipping shipping = shippingRepository.findByOrderId(orderId).orElse(null);

        return VendorOrderShippingDTO.builder()
                .orderId(order.getOrderId())
                .shopId(order.getShopId())
                .orderStatus(order.getOrderStatus())
                .shipperId(order.getShipperId())
                .shipping(shipping)
                .build();
    }

    // Update status — verify vendor trước
    public Order updateOrderStatusForVendor(String vendorId, String orderId, UpdateStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        List<String> shopIds = shopInternalClient.getShopIdsByVendor(vendorId);
        if (!shopIds.contains(order.getShopId())) {
            throw new ForbiddenException("You do not have permission to update this order.");
        }

        return updateOrderStatus(orderId, request);
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

    public List<ShipperWithStatusDTO> getAvailableShippers(String vendorId) {
    List<ShipperBasicDTO> allShippers = userInternalClient.getAllShippers();

    return allShippers.stream()
            .map(shipper -> {
                ShipperStatus status = shipperStatusRepository
                        .findById(shipper.getShipperId())
                        .orElse(null);
                String currentStatus = status != null ? status.getStatus() : "AVAILABLE";
                String reason = status != null ? status.getUnavailableReason() : null;
                return ShipperWithStatusDTO.builder()
                        .shipperId(shipper.getShipperId())
                        .fullName(shipper.getFullName())
                        .phone(shipper.getPhone())
                        .status(currentStatus)
                        .unavailableReason(reason)
                        .build();
            })
            .filter(s -> "AVAILABLE".equals(s.getStatus()))
            .toList();
    }

/**
 * Vendor assign shipper cho đơn — verify quyền, set pickup address từ warehouse.
 */
@Transactional
public ShippingResponseDTO assignShipperToOrder(String vendorId, String orderId, String shipperId) {
    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

    List<String> shopIds = shopInternalClient.getShopIdsByVendor(vendorId);
    if (!shopIds.contains(order.getShopId())) {
        throw new ForbiddenException("You do not have permission to assign shipper for this order.");
    }

    if (order.getOrderStatus() != OrderStatus.PROCESSING) {
        throw new BadRequestException("Can only assign shipper to orders in PROCESSING status.");
    }

    ShipperStatus shipperStatus = shipperStatusRepository.findById(shipperId)
            .orElse(null);
    if (shipperStatus != null && !"AVAILABLE".equals(shipperStatus.getStatus())) {
        throw new BadRequestException("Shipper is not available. Current status: " + shipperStatus.getStatus());
    }

    WarehouseInfoDTO warehouse = shopInternalClient.getWarehouseInfo(order.getShopId());

    Shipping shipping = shippingRepository.findByOrderId(orderId)
            .orElse(Shipping.builder()
                    .orderId(orderId)
                    .build());

    shipping.setShipperId(shipperId);
    shipping.setStatus(ShippingStatus.PICKING_UP);
    if (warehouse != null) {
        shipping.setPickupAddress(warehouse.getWarehouseAddress());
        shipping.setPickupCity(warehouse.getWarehouseCity());
        shipping.setPickupDistrict(warehouse.getWarehouseDistrict());
        shipping.setPickupWard(warehouse.getWarehouseWard());
        shipping.setPickupPhone(warehouse.getWarehousePhone());
    }
    Shipping saved = shippingRepository.save(shipping);

    order.setShipperId(shipperId);
    order.setOrderStatus(OrderStatus.SHIPPING);
    orderRepository.save(order);
    Order savedOrder = orderRepository.save(order);
    createTrackingLog(savedOrder, "Shipper Assigned",
        "Shipper " + shipperId + " has been assigned by vendor",
        saved.getShippingId().toString(), null, null);
    ShipperStatus newStatus = shipperStatusRepository.findById(shipperId)
            .orElse(ShipperStatus.builder().shipperId(shipperId).build());
    newStatus.setStatus("ON_DELIVERY");
    newStatus.setUnavailableReason(null);
    newStatus.setUpdatedAt(java.time.LocalDateTime.now());
    shipperStatusRepository.save(newStatus);

    return ShippingResponseDTO.builder()
            .shippingId(saved.getShippingId())
            .orderId(saved.getOrderId())
            .shipperId(saved.getShipperId())
            .status(saved.getStatus())
            .pickupAddress(saved.getPickupAddress())
            .pickupCity(saved.getPickupCity())
            .pickupDistrict(saved.getPickupDistrict())
            .pickupWard(saved.getPickupWard())
            .pickupPhone(saved.getPickupPhone())
            .updatedAt(saved.getUpdatedAt())
            .build();
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