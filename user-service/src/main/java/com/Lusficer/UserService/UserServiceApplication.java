package com.Lusficer.UserService;

import com.Lusficer.UserService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(UserServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}