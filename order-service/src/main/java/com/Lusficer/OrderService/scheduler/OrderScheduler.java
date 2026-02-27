// File: src/main/java/com/Lusficer/OrderService/scheduler/OrderScheduler.java
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

@Component
public class OrderScheduler {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderService orderService;

    // Chạy mỗi 1 giờ để quét đơn
    @Scheduled(cron = "0 0 * * * ?") 
    public void autoCompleteOrders() {
        // Giả sử chính sách là 7 ngày sau khi giao hàng
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // Tìm các đơn DELIVERED đã quá 7 ngày
        // Cần viết thêm method này trong Repository
        List<Order> ordersToComplete = orderRepository.findByOrderStatusAndUpdatedAtBefore(
                OrderStatus.DELIVERED, sevenDaysAgo
        );

        for (Order order : ordersToComplete) {
            try {
                // Gọi hàm nội bộ để update (không cần check user)
                internalCompleteOrder(order);
                System.out.println("Auto-completed order: " + order.getOrderId());
            } catch (Exception e) {
                System.err.println("Failed to auto-complete order: " + order.getOrderId());
            }
        }
    }

    private void internalCompleteOrder(Order order) {
        order.setOrderStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
        // Bắn event update doanh thu ở đây...
    }
}