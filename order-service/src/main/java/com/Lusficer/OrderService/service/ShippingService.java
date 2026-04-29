package com.Lusficer.OrderService.service;

import com.Lusficer.OrderService.client.InventoryClient;
import com.Lusficer.OrderService.client.ShopInternalClient;
import com.Lusficer.OrderService.client.StatisticsClient;
import com.Lusficer.OrderService.client.StatisticsClient.OrderCompletedEvent;
import com.Lusficer.OrderService.client.StatisticsClient.ProductItemDto;
import com.Lusficer.OrderService.dto.request.ShippingRequestDTO;
import com.Lusficer.OrderService.dto.request.UpdateShipperStatusRequest;
import com.Lusficer.OrderService.dto.request.UploadPhotoRequest;
import com.Lusficer.OrderService.dto.response.ShipperAvailableOrderDTO;
import com.Lusficer.OrderService.dto.response.ShippingPhotoDTO;
import com.Lusficer.OrderService.dto.response.ShippingResponseDTO;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.entity.OrderTracking;
import com.Lusficer.OrderService.entity.ShipperStatus;
import com.Lusficer.OrderService.entity.Shipping;
import com.Lusficer.OrderService.entity.ShippingPhoto;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.enums.ShippingStatus;
import com.Lusficer.OrderService.exception.BadRequestException;
import com.Lusficer.OrderService.exception.ForbiddenException;
import com.Lusficer.OrderService.exception.ResourceNotFoundException;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.repository.OrderTrackingRepository;
import com.Lusficer.OrderService.repository.ShipperStatusRepository;
import com.Lusficer.OrderService.repository.ShippingPhotoRepository;
import com.Lusficer.OrderService.repository.ShippingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShippingService {

    private final ShippingRepository shippingRepository;
    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final StatisticsClient statisticsClient;
    private final NotificationHelper notificationHelper;
    private final ShipperStatusRepository shipperStatusRepository;
    private final ShippingPhotoRepository shippingPhotoRepository;
    private final ShopInternalClient shopInternalClient;
    private final OrderTrackingRepository trackingRepository;

    @Value("${app.upload.dir:uploads/shipping-photos}")
    private String uploadDir;

    /**
     * Updates shipping status and synchronizes related order state.
     */
    @Transactional
    public ShippingResponseDTO updateShippingStatus(String shipperId, ShippingRequestDTO request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.getOrderId()));

        if (order.getOrderStatus() == OrderStatus.PENDING_VERIFICATION ||
            order.getOrderStatus() == OrderStatus.NEW ||
            order.getOrderStatus() == OrderStatus.CANCELLED ||
            order.getOrderStatus() == OrderStatus.REJECTED) {
            throw new BadRequestException("Order is not ready for shipping updates or has been cancelled.");
        }

        Shipping shipping = shippingRepository.findByOrderId(request.getOrderId())
                .orElseGet(() -> {
                    Shipping newShipping = new Shipping();
                    newShipping.setOrderId(request.getOrderId());
                    newShipping.setShipperId(shipperId);
                    return newShipping;
                });

        if (shipping.getShipperId() == null) {
            shipping.setShipperId(shipperId);
        }

        shipping.setStatus(request.getStatus());
        shipping.setNote(request.getNote());
        Shipping savedShipping = shippingRepository.save(shipping);
        String shipmentId = savedShipping.getShippingId().toString();

        if (request.getStatus() == ShippingStatus.PICKING_UP) {
            order.setOrderStatus(OrderStatus.SHIPPING);
            createTrackingLog(order, "Picking Up",
                    "Shipper is on the way to pick up the order",
                    shipmentId, null, null);
        }
        else if (request.getStatus() == ShippingStatus.IN_TRANSIT) {
            order.setOrderStatus(OrderStatus.SHIPPING);
            createTrackingLog(order, "In Transit",
                    "Order is on the way to customer",
                    shipmentId, null, null);
        }
        else if (request.getStatus() == ShippingStatus.DELIVERED) {
            order.setOrderStatus(OrderStatus.DELIVERED);
            createTrackingLog(order, "Delivered",
                    "Order delivered successfully",
                    shipmentId, null, null);

            // Reset shipper status về AVAILABLE
            shipperStatusRepository.findById(shipperId).ifPresent(s -> {
                s.setStatus("AVAILABLE");
                s.setUnavailableReason(null);
                s.setUpdatedAt(LocalDateTime.now());
                shipperStatusRepository.save(s);
            });

            // Notify customer
            try {
                notificationHelper.notifyOrderStatusChanged(order.getOrderId(), order.getUserId(), OrderStatus.DELIVERED.name());
            } catch (Exception e) {
                System.err.println("Failed to send DELIVERED notification: " + e.getMessage());
            }

            // Confirm inventory sale
            try {
                inventoryClient.confirmSale(order.getOrderId());
            } catch (Exception e) {
                System.err.println("Failed to call InventoryClient: " + e.getMessage());
            }

            // Sync statistics
            try {
                List<ProductItemDto> items = order.getOrderItems().stream()
                        .map(item -> new ProductItemDto(
                                item.getProductId(),
                                item.getProductName(),
                                item.getQuantity(),
                                item.getTotalPrice()))
                        .collect(Collectors.toList());

                OrderCompletedEvent event = new OrderCompletedEvent(
                        order.getShopId(),
                        order.getGrandTotal(),
                        java.time.LocalDate.now(),
                        items
                );
                statisticsClient.syncOrder(event);
            } catch (Exception e) {
                System.err.println("Failed to call StatisticsClient: " + e.getMessage());
            }
        }
        else if (request.getStatus() == ShippingStatus.FAILED) {
            order.setOrderStatus(OrderStatus.DELIVERY_FAILED);
            createTrackingLog(order, "Delivery Failed",
                    "Delivery attempt failed",
                    shipmentId, null, null);
        }
        else if (request.getStatus() == ShippingStatus.RETURNED) {
            order.setOrderStatus(OrderStatus.RETURNED);
            createTrackingLog(order, "Returned",
                    "Order has been returned to shop",
                    shipmentId, null, null);

            shipperStatusRepository.findById(shipperId).ifPresent(s -> {
                s.setStatus("AVAILABLE");
                s.setUnavailableReason(null);
                s.setUpdatedAt(LocalDateTime.now());
                shipperStatusRepository.save(s);
            });

            // Notify customer
            try {
                notificationHelper.notifyOrderStatusChanged(order.getOrderId(), order.getUserId(), OrderStatus.RETURNED.name());
            } catch (Exception e) {
                System.err.println("Failed to send RETURNED notification: " + e.getMessage());
            }

            // Release stock
            try {
                inventoryClient.releaseStock(order.getOrderId());
                System.out.println("Has released stock for returned order: " + order.getOrderId());
            } catch (Exception e) {
                System.err.println("Error when releasing stock: " + e.getMessage());
            }
        }

        orderRepository.save(order);

        return ShippingResponseDTO.builder()
                .shippingId(savedShipping.getShippingId())
                .orderId(savedShipping.getOrderId())
                .shipperId(savedShipping.getShipperId())
                .status(savedShipping.getStatus())
                .note(savedShipping.getNote())
                .pickupAddress(savedShipping.getPickupAddress())
                .pickupCity(savedShipping.getPickupCity())
                .pickupDistrict(savedShipping.getPickupDistrict())
                .pickupWard(savedShipping.getPickupWard())
                .pickupPhone(savedShipping.getPickupPhone())
                .updatedAt(savedShipping.getUpdatedAt())
                .build();
    }

    /**
     * Returns orders that are ready for a shipper to accept.
     */
    public List<Order> getAvailableOrders() {
        return orderRepository.findByOrderStatusAndShipperIdIsNull(OrderStatus.SHIPPING);
    }

    /**
     * Returns available orders along with pickup (warehouse) and delivery addresses.
     */
    public List<ShipperAvailableOrderDTO> getAvailableOrdersWithPickupInfo() {
        return orderRepository.findByOrderStatusAndShipperIdIsNull(OrderStatus.SHIPPING)
            .stream()
            .map(order -> {
                Shipping shipping = shippingRepository.findByOrderId(order.getOrderId()).orElse(null);
                return ShipperAvailableOrderDTO.builder()
                    .orderId(order.getOrderId())
                    .shopId(order.getShopId())
                    .grandTotal(order.getGrandTotal())
                    .pickupAddress(shipping != null ? shipping.getPickupAddress() : null)
                    .pickupCity(shipping != null ? shipping.getPickupCity() : null)
                    .pickupDistrict(shipping != null ? shipping.getPickupDistrict() : null)
                    .pickupWard(shipping != null ? shipping.getPickupWard() : null)
                    .pickupPhone(shipping != null ? shipping.getPickupPhone() : null)
                    .deliveryAddress(order.getOrderAddress() != null ? order.getOrderAddress().getAddressLine() : null)
                    .deliveryCity(order.getOrderAddress() != null ? order.getOrderAddress().getCity() : null)
                    .deliveryDistrict(order.getOrderAddress() != null ? order.getOrderAddress().getDistrict() : null)
                    .deliveryWard(order.getOrderAddress() != null ? order.getOrderAddress().getWard() : null)
                    .deliveryPhone(order.getOrderAddress() != null ? order.getOrderAddress().getPhone() : null)
                    .items(order.getOrderItems() == null ? List.of() : order.getOrderItems().stream()
                        .map(i -> ShipperAvailableOrderDTO.OrderItemDTO.builder()
                            .productId(i.getProductId())
                            .productName(i.getProductName())
                            .productImage(i.getProductImage())
                            .quantity(i.getQuantity())
                            .build())
                        .toList())
                    .build();
            })
            .toList();
    }

    /**
     * Assigns the order to the requesting shipper.
     */
    public Order acceptOrder(String orderId, String shipperId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getOrderStatus() != OrderStatus.SHIPPING) {
            throw new BadRequestException("Order is not ready for shipping");
        }

        if (order.getShipperId() != null) {
            throw new BadRequestException("This order has already been accepted by another shipper.");
        }

        order.setShipperId(shipperId);

        shippingRepository.findByOrderId(orderId).ifPresent(shipping -> {
            if (shipping.getShipperId() == null) {
                shipping.setShipperId(shipperId);
                shippingRepository.save(shipping);
            }
        });

        Order savedOrder = orderRepository.save(order);
        createTrackingLog(savedOrder, "Shipper Accepted",
                "Shipper " + shipperId + " accepted the order",
                "PENDING", null, null);

        return savedOrder;
    }

    /**
     * Returns shipper status, creates default AVAILABLE if not exists.
     */
    public ShipperStatus getShipperStatus(String shipperId) {
        return shipperStatusRepository.findById(shipperId)
                .orElseGet(() -> {
                    ShipperStatus defaultStatus = ShipperStatus.builder()
                            .shipperId(shipperId)
                            .status("AVAILABLE")
                            .unavailableReason(null)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return shipperStatusRepository.save(defaultStatus);
                });
    }

    /**
     * Updates shipper availability status.
     */
    @Transactional
    public ShipperStatus updateShipperStatus(String shipperId, UpdateShipperStatusRequest request) {
        List<String> validStatuses = List.of("AVAILABLE", "UNAVAILABLE", "ON_DELIVERY");
        if (!validStatuses.contains(request.getStatus())) {
            throw new BadRequestException("Invalid status. Must be one of: AVAILABLE, UNAVAILABLE, ON_DELIVERY");
        }

        if ("UNAVAILABLE".equals(request.getStatus())
                && (request.getUnavailableReason() == null
                || request.getUnavailableReason().isBlank())) {
            throw new BadRequestException("unavailableReason is required when status is UNAVAILABLE");
        }

        ShipperStatus shipperStatus = shipperStatusRepository.findById(shipperId)
                .orElse(ShipperStatus.builder()
                        .shipperId(shipperId)
                        .build());

        shipperStatus.setStatus(request.getStatus());
        shipperStatus.setUnavailableReason(
            "UNAVAILABLE".equals(request.getStatus()) ? request.getUnavailableReason() : null
        );
        shipperStatus.setUpdatedAt(LocalDateTime.now());

        return shipperStatusRepository.save(shipperStatus);
    }

    /**
     * Shipper upload ảnh cho đơn hàng.
     */
    @Transactional
    public ShippingPhotoDTO uploadPhoto(String shipperId, String orderId,
                                        MultipartFile file,
                                        ShippingStatus photoType) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!shipperId.equals(order.getShipperId())) {
            throw new ForbiddenException("You are not assigned to this order.");
        }

        Shipping shipping = shippingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipping record not found"));

        if (photoType != shipping.getStatus()) {
            throw new BadRequestException(
                "photoType must match current shipping status: " + shipping.getStatus());
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Photo file is required.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed.");
        }

        String photoUrl = saveFileLocal(file, orderId);

        ShippingPhoto photo = ShippingPhoto.builder()
                .shippingId(shipping.getShippingId())
                .photoUrl(photoUrl)
                .photoType(photoType)
                .build();

        ShippingPhoto saved = shippingPhotoRepository.save(photo);

        return ShippingPhotoDTO.builder()
                .id(saved.getId())
                .shippingId(saved.getShippingId())
                .photoUrl(saved.getPhotoUrl())
                .photoType(saved.getPhotoType())
                .uploadedAt(saved.getUploadedAt())
                .build();
    }

    /**
     * Lấy tất cả ảnh của một đơn hàng.
     */
    public List<ShippingPhotoDTO> getPhotosByOrder(String orderId) {
        Shipping shipping = shippingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipping record not found"));

        return shippingPhotoRepository.findByShippingId(shipping.getShippingId())
                .stream()
                .map(photo -> ShippingPhotoDTO.builder()
                        .id(photo.getId())
                        .shippingId(photo.getShippingId())
                        .photoUrl(photo.getPhotoUrl())
                        .photoType(photo.getPhotoType())
                        .uploadedAt(photo.getUploadedAt())
                        .build())
                .toList();
    }

    /**
     * Vendor xem ảnh của đơn — verify quyền trước.
     */
    public List<ShippingPhotoDTO> getPhotosByOrderForVendor(String vendorId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        List<String> shopIds = shopInternalClient.getShopIdsByVendor(vendorId);
        if (!shopIds.contains(order.getShopId())) {
            throw new ForbiddenException("You do not have permission to view this order.");
        }

        return getPhotosByOrder(orderId);
    }

    /**
     * Returns orders assigned to the specified shipper filtered by status.
     */
    public List<Order> getMyAssignedOrders(String shipperId, String status) {
        OrderStatus orderStatus = OrderStatus.valueOf(status);
        return orderRepository.findByShipperIdAndOrderStatus(shipperId, orderStatus);
    }

    /**
     * Lưu file vào local storage, trả về relative URL.
     */
    private String saveFileLocal(MultipartFile file, String orderId) {
        try {
            Path uploadPath = Paths.get(uploadDir, orderId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/shipping-photos/" + orderId + "/" + filename;

        } catch (IOException e) {
            throw new RuntimeException("Failed to save photo: " + e.getMessage());
        }
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
                .shipmentId(shipmentId != null ? shipmentId : "PENDING")
                .trackingNumber(trackingNumber)
                .carrierName(carrierName)
                .build();
        trackingRepository.save(tracking);
    }
}