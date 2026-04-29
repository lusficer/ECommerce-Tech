package com.Lusficer.DisputeService;

import com.Lusficer.DisputeService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.Lusficer.DisputeService.client")
public class DisputeServiceApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(DisputeServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}