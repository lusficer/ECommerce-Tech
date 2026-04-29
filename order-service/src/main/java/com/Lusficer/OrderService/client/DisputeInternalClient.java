package com.Lusficer.OrderService.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "dispute-service", url = "http://localhost:8084")
public interface DisputeInternalClient {

    @GetMapping("/api/internal/disputes/user/{userId}/exists")
    Boolean userHasDispute(@PathVariable("userId") String userId);
}
