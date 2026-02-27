package com.Lusficer.CartService.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.net.URI;

@RestController
public class ActuatorRedirectController {

    @Value("${server.port}")
    private String serverPort;

    @GetMapping("/actuator/info")
    public ResponseEntity<Void> redirectToSwagger() {
        String swaggerUrl = String.format("http://localhost:%s/swagger-ui/index.html", serverPort);
        return ResponseEntity.status(HttpStatus.FOUND)
                           .location(URI.create(swaggerUrl))
                           .build();
    }
}
