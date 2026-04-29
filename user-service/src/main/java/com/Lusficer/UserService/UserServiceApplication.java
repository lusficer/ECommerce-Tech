package com.Lusficer.UserService;

import com.Lusficer.UserService.config.EnvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableFeignClients
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(UserServiceApplication.class);
        application.addInitializers(new EnvInitializer());
        application.run(args);
    }
}