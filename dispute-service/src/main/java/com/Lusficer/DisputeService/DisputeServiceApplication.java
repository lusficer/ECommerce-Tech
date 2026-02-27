package com.Lusficer.DisputeService;

import com.Lusficer.DisputeService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DisputeServiceApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(DisputeServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}