package com.Lusficer.OrderService.client;

import com.Lusficer.OrderService.dto.response.ShipperBasicDTO;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;

@FeignClient(name = "user-service", contextId = "userInternalClient", url = "http://localhost:8081")
public interface UserInternalClient {

    @GetMapping("/api/internal/users/{userId}/created-at")
    LocalDateTime getUserCreatedAt(@PathVariable("userId") String userId);

    @GetMapping("/api/internal/users/shippers")
    List<ShipperBasicDTO> getAllShippers();
}