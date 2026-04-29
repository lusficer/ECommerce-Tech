package com.Lusficer.ProductService.client;

import com.Lusficer.ProductService.dto.request.CreateNotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "user-service", url = "http://localhost:8081")
public interface NotificationClient {
    @PostMapping("/api/internal/notifications")
    String createNotification(@RequestBody CreateNotificationRequest request);
}
