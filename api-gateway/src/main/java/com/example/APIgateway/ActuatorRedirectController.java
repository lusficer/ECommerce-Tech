package com.example.APIgateway;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ActuatorRedirectController {

    @GetMapping("/actuator/info")
    public String redirectToSwagger() {
        return "redirect:/swagger-ui/index.html";
    }
}
