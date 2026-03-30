package com.Lusficer.OrderService.scheduler;

import com.Lusficer.OrderService.entity.Order;
import com.Lusficer.OrderService.enums.OrderStatus;
import com.Lusficer.OrderService.repository.OrderRepository;
import com.Lusficer.OrderService.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled tasks for order management.
 */
@Component
public class OrderScheduler {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderService orderService;

    /**
     * Auto-completes delivered orders after 7 days.
     * Runs every hour.
     */
    @Scheduled(cron = "0 0 * * * ?") 
    public void autoCompleteOrders() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        List<Order> ordersToComplete = orderRepository.findByOrderStatusAndUpdatedAtBefore(
                OrderStatus.DELIVERED, sevenDaysAgo
        );

        for (Order order : ordersToComplete) {
            try {
                internalCompleteOrder(order);
                System.out.println("Auto-completed order: " + order.getOrderId());
            } catch (Exception e) {
                System.err.println("Failed to auto-complete order: " + order.getOrderId());
            }
        }
    }

    /**
     * Marks an order as completed and persists the change.
     */
    private void internalCompleteOrder(Order order) {
        order.setOrderStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
    }
}