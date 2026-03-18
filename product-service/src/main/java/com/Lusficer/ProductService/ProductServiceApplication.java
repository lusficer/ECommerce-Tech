package com.Lusficer.ProductService;

import com.Lusficer.ProductService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients 
@EnableCaching 
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ProductServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}