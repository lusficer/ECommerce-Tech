package com.Lusficer.StatisticsService;

import com.Lusficer.StatisticsService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StatisticsApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(StatisticsApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);    }
}