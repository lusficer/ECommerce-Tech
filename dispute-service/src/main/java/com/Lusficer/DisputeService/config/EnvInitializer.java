package com.Lusficer.DisputeService.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class EnvInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        System.out.println("Initializing EnvInitializer - Working directory: " + System.getProperty("user.dir"));
        Dotenv dotenv = Dotenv.configure()
            .directory("/Users/lethanhtuan/VSC/E-commerce/") // Absolute path to the workspace root
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
            System.out.println("Set property: " + entry.getKey() + "=" + entry.getValue());
        });
    }
}

