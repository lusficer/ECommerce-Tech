package com.Lusficer.RecommendationService;

import com.Lusficer.RecommendationService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients // BẮT BUỘC: Để kích hoạt Feign Client
public class RecommendationServiceApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(RecommendationServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}