package com.Lusficer.FulfillmentService;

import com.Lusficer.FulfillmentService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients // Kích hoạt Feign để gọi Product Service
public class FulfillmentApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(FulfillmentApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);    }
}