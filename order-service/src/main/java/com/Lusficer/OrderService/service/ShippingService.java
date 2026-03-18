package com.Lusficer.OrderService.service;

import com.Lusficer.OrderService.client.InventoryClient;
import com.Lusficer.OrderService.client.StatisticsClient;
import com.Lusficer.OrderService.client.StatisticsClient.OrderCompletedEvent;
import com.Lusficer.OrderService.client.StatisticsClient.ProductItemDto;
import com.Lusficer.OrderService.dto.request.ShippingRequestDTO;
import com.Lusficer.OrderService.dto.response.ShippingResponseDTO;
import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.entity.Shipping;
import com.Lusficer.OrderService.enums.ShippingStatus;
import com.Lusficer.OrderService.exception.BadRequestException;
import com.Lusficer.OrderService.exception.ResourceNotFoundException;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.repository.ShippingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShippingService {

    private final ShippingRepository shippingRepository;
    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final StatisticsClient statisticsClient;

    @Transactional
    public ShippingResponseDTO updateShippingStatus(String shipperId, ShippingRequestDTO request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + request.getOrderId()));

        if (order.getOrderStatus() == OrderStatus.PENDING_VERIFICATION || 
            order.getOrderStatus() == OrderStatus.NEW ||
            order.getOrderStatus() == OrderStatus.CANCELLED ||
            order.getOrderStatus() == OrderStatus.REJECTED) {
            throw new BadRequestException("Đơn hàng chưa được Shop chuẩn bị xong hoặc đã bị hủy, không thể cập nhật vận chuyển!");
        }

        Shipping shipping = shippingRepository.findByOrderId(request.getOrderId())
                .orElseGet(() -> {
                    Shipping newShipping = new Shipping();
                    newShipping.setOrderId(request.getOrderId());
                    newShipping.setShipperId(shipperId);
                    return newShipping;
                });

        shipping.setStatus(request.getStatus());
        shipping.setNote(request.getNote());
        Shipping savedShipping = shippingRepository.save(shipping);

        if (request.getStatus() == ShippingStatus.IN_TRANSIT) {
            order.setOrderStatus(OrderStatus.SHIPPING); 
        } 
        else if (request.getStatus() == ShippingStatus.DELIVERED) {
            order.setOrderStatus(OrderStatus.DELIVERED);
            
            // 1. Gọi InventoryService để trừ kho thật sự (CONFIRM_SALE)
            try {
                inventoryClient.confirmSale(order.getOrderId());
            } catch (Exception e) {
                System.err.println("Lỗi gọi InventoryClient: " + e.getMessage());
            }

            // 2. Gọi StatisticsService để đồng bộ doanh thu
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
                System.err.println("Lỗi gọi StatisticsClient: " + e.getMessage());
            }
        } 
        else if (request.getStatus() == ShippingStatus.FAILED) {
            order.setOrderStatus(OrderStatus.SHIPPING); 
        } 
        else if (request.getStatus() == ShippingStatus.RETURNED) {
            order.setOrderStatus(OrderStatus.DELIVERY_FAILED);
            
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
                .updatedAt(savedShipping.getUpdatedAt())
                .build();
    }

     public List<Order> getAvailableOrders() {
        return orderRepository.findByOrderStatusAndShipperIdIsNull(OrderStatus.SHIPPING);
    }

    // 2. Shipper bấm "Nhận đơn"
    public Order acceptOrder(String orderId, String shipperId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getOrderStatus() != OrderStatus.SHIPPING) {
            throw new BadRequestException("Order is not ready for shipping");
        }

        if (order.getShipperId() != null) {
            throw new BadRequestException("Đơn hàng này đã bị Shipper khác nhận mất rồi!");
        }

        order.setShipperId(shipperId);
        return orderRepository.save(order);
    }

    // 3. Lấy danh sách đơn hàng CỦA RIÊNG Shipper này (Để hiện ở tab My Deliveries)
    public List<Order> getMyAssignedOrders(String shipperId, String status) {
        OrderStatus orderStatus = OrderStatus.valueOf(status);
        return orderRepository.findByShipperIdAndOrderStatus(shipperId, orderStatus);
    }

}