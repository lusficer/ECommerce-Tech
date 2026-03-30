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

        shipping.setStatus(request.getStatus());
        shipping.setNote(request.getNote());
        Shipping savedShipping = shippingRepository.save(shipping);

        if (request.getStatus() == ShippingStatus.IN_TRANSIT) {
            order.setOrderStatus(OrderStatus.SHIPPING); 
        } 
        else if (request.getStatus() == ShippingStatus.DELIVERED) {
            order.setOrderStatus(OrderStatus.DELIVERED);
            
            // Confirm inventory sale on successful delivery.
            try {
                inventoryClient.confirmSale(order.getOrderId());
            } catch (Exception e) {
                System.err.println("Failed to call InventoryClient: " + e.getMessage());
            }

            // Sync completed order metrics.
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

    /**
     * Returns orders that are ready for a shipper to accept.
     */
    public List<Order> getAvailableOrders() {
        return orderRepository.findByOrderStatusAndShipperIdIsNull(OrderStatus.SHIPPING);
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
        return orderRepository.save(order);
    }

    /**
     * Returns orders assigned to the specified shipper filtered by status.
     */
    public List<Order> getMyAssignedOrders(String shipperId, String status) {
        OrderStatus orderStatus = OrderStatus.valueOf(status);
        return orderRepository.findByShipperIdAndOrderStatus(shipperId, orderStatus);
    }

}