package com.Lusficer.CartService;

import com.Lusficer.CartService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients // Kích hoạt Feign để gọi Product Service
public class CartApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(CartApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);    }
}