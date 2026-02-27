package com.Lusficer.InventoryService; 

import com.Lusficer.InventoryService.config.EnvInitializer; 
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling; 

@SpringBootApplication
@EnableScheduling   
@EnableFeignClients
public class InventoryApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(InventoryApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);    
    }
}