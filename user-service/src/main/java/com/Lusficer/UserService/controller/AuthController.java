package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.config.JwtTokenProvider;
import com.Lusficer.UserService.entity.UserAuth;
import com.Lusficer.UserService.dto.request.LoginRequest;
import com.Lusficer.UserService.dto.request.RegisterRequest;
import com.Lusficer.UserService.dto.response.LoginResponse;
import com.Lusficer.UserService.dto.response.RegistrationResponse;
import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.entity.UserStatus;
import com.Lusficer.UserService.exception.AccountBannedException;
import com.Lusficer.UserService.repository.UserAuthRepository;
import com.Lusficer.UserService.repository.UserProfileRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import com.Lusficer.UserService.repository.UserStatusRepository;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, Register")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserProfileRepository profileRepo;
    private final UserAuthRepository authRepo;
    private final UserRoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserStatusRepository statusRepo;

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    /**
     * Creates a rate limit bucket for login attempts.
     * Allows 5 attempts per 15 minutes per IP address.
     */
    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.greedy(5, Duration.ofMinutes(15)));
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Authenticates user and returns JWT token.
     * Implements rate limiting: 5 attempts per 15 minutes per IP.
     */
    @PostMapping("/login")
    @Operation(summary = "Login", description = "Login → returns JWT")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        
        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());

        if (!bucket.tryConsume(1)) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("timestamp", LocalDateTime.now());
            errorBody.put("status", 429);
            errorBody.put("error", "Too Many Requests");
            errorBody.put("message", "Too many login attempts. Please try again after 15 minutes.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorBody);
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );
            UserProfile user = profileRepo.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

            statusRepo.findById(user.getUserId()).ifPresent(status -> {
                if (Boolean.TRUE.equals(status.getIsBanned())) {
                    String reason = status.getBanReason();
                    String message = (reason == null || reason.isBlank())
                            ? "Account has been banned. Please contact support."
                            : "Account has been banned. Reason: " + reason;
                    throw new AccountBannedException(message);
                }
            });

            String jwt = jwtTokenProvider.generateToken(auth);
                 
            return ResponseEntity.ok(new LoginResponse(jwt, user.getUserId()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            // BadCredentialsException, DisabledException, LockedException, etc.
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("timestamp", LocalDateTime.now());
            errorBody.put("status", 400);
            errorBody.put("error", "Bad Request");
            errorBody.put("message", "Email hoặc mật khẩu không đúng");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody);
        }
    }

    /**
     * Registers a new user with specified role.
     * Auto-generates sequential userId based on role prefix.
     * Creates associated auth, role, and status records.
     */
    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Create a user account and assign a role (selectable via dropdown)")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegisterRequest request) {
        String userLabel;
        switch (request.role().name()) {
            case "ADMIN" -> userLabel = "ADMIN";
            case "CUSTOMER" -> userLabel = "CUST";
            case "SHOP_MANAGER" -> userLabel = "SHOP_MNG";
            case "VENDOR" -> userLabel = "VEND";
            case "GUEST" -> userLabel = "GUEST";
            case "WAREHOUSE_MANAGER" -> userLabel = "WM";
            case "SHIPPER" -> userLabel = "SH"; 
            default -> userLabel = "U";
        }

        long existing = profileRepo.countByUserIdStartingWith(userLabel + "_");
        int next = (int) existing + 1;
        String userId = String.format("%s_%03d", userLabel, next);

        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        profileRepo.save(profile);

        UserAuth auth = UserAuth.builder()
                .authId(UUID.randomUUID().toString())
                .userId(profile.getUserId())
                .provider("LOCAL")
                .passwordHash(passwordEncoder.encode(request.password()))
                .createdAt(LocalDateTime.now())
                .build();
        authRepo.save(auth);

        String prefix;
        switch (request.role().name()) {
            case "ADMIN" -> prefix = "AD";
            case "CUSTOMER" -> prefix = "C";
            case "SHOP_MANAGER" -> prefix = "S";
            case "VENDOR" -> prefix = "V";
            case "GUEST" -> prefix = "G";
            case "SHIPPER" -> prefix = "SH";
            default -> prefix = "U";
        }
        String roleId = String.format("%s-%03d", prefix, next);

        UserRole role = UserRole.builder()
                .roleId(roleId)
                .userId(profile.getUserId())
                .roleName(request.role())
                .createdAt(LocalDateTime.now())
                .build();
        roleRepo.save(role);

        UserStatus status = UserStatus.builder()
                .userId(profile.getUserId()) 
                .isOnline(true)             
                .isVerified(false)           
                .isBanned(false)            
                .build();
        statusRepo.save(status);

        RegistrationResponse resp = RegistrationResponse.builder()
                .message("Registration successful")
                .userId(profile.getUserId())
                .build();

        return ResponseEntity.ok(resp);
    }
}
