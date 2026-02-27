package com.Lusficer.ShopService.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF
            .csrf(csrf -> csrf.disable())
            
            // Disable Basic Auth popup
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            
            // Use stateless session
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Configure CORS
            .cors(cors -> cors.configure(http))
            
            // Configure authorization
            .authorizeHttpRequests(auth -> auth
                // Swagger UI and API docs
                .requestMatchers("/v3/api-docs/**", 
                               "/swagger-ui/**", 
                               "/swagger-ui.html",
                               "/webjars/**").permitAll()
                // Actuator endpoints
                .requestMatchers("/actuator/**").permitAll()
                // Public APIs
                .requestMatchers("/api/public/**").permitAll()
                // Protected APIs
                .anyRequest().permitAll()  // Tạm thời cho phép tất cả request cho đến khi implement JWT
            )
            
            // Exception handling
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Unauthorized\"}");
                })
            );

        return http.build();
    }
}