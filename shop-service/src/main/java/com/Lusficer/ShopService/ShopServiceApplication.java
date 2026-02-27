package com.Lusficer.ShopService;

import com.Lusficer.ShopService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopServiceApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ShopServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}