package com.Lusficer.UserService.config;

// user-service/src/main/java/com/Lusficer/UserService/config/JwtTokenProvider.java

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:your-256-bit-secret-key-here-please-change-in-production}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24h
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        // Convert the configured secret string into a SecretKey suitable for
        // HMAC-SHA signing. Keys.hmacShaKeyFor enforces the minimum key length
        // requirement for the chosen algorithm (>= 256 bits). Ensure the
        // `jwt.secret` property is at least 32 bytes (256 bits) when using
        // HS256/HS384/HS512 to avoid WeakKeyException.
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Generate a JWT from an Authentication object
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

    // Build token with standard claims:
    // - subject: username (we use userId as the subject)
    // - custom claim `roles`: comma-separated roles for downstream checks
    // Signed with the secret key using HS512. Use a long-lived key and
    // reasonable expiration time (configured via `jwt.expiration`).
    return Jwts.builder()
        .setSubject(userDetails.getUsername()) // userId
        .claim("roles", authorities)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(getSigningKey(), SignatureAlgorithm.HS512)
        .compact();
    }

    // Extract userId from a JWT token (used by controllers/filters)
    public String getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // Extract userId from an Authentication object (used in controllers)
    public String getUserIdFromAuth(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return null;
        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return userDetails.getUsername(); // ← userId
        }
        return auth.getName();
    }

    // Validate token
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}