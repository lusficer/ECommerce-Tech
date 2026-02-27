package com.Lusficer.UserService.config;

import com.p6spy.engine.spy.P6SpyOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class P6SpyConfig {
    
    @PostConstruct
    public void initialize() {
        P6SpyOptions.getActiveInstance().setLogMessageFormat(P6SpyCustomFormatter.class.getName());
    }
}