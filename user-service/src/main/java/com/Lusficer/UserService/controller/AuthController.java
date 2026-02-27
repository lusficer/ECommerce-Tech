// user-service/src/main/java/com/Lusficer/UserService/controller/AuthController.java
package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.config.JwtTokenProvider;
import com.Lusficer.UserService.dto.LoginRequest;
import com.Lusficer.UserService.dto.LoginResponse;
import com.Lusficer.UserService.dto.RegisterRequest;
import com.Lusficer.UserService.entity.UserAuth;
import com.Lusficer.UserService.dto.RegistrationResponse;
import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.repository.UserAuthRepository;
import com.Lusficer.UserService.repository.UserProfileRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

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

        @PostMapping("/login")
        @Operation(summary = "Login", description = "Login → returns JWT")
        public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password())
        );
        String jwt = jwtTokenProvider.generateToken(auth);
        return ResponseEntity.ok(new LoginResponse(jwt));
        }

        @PostMapping("/register")
        @Operation(summary = "Register user", description = "Create a user account and assign a role (selectable via dropdown)")
        public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegisterRequest request) {
        // 1. Create UserProfile
        // Determine a human-friendly userId label based on the requested role
                String userLabel;
                switch (request.role().name()) {
                    case "ADMIN" -> userLabel = "ADMIN";
                    case "CUSTOMER" -> userLabel = "CUST";
                    case "SHOP_MANAGER" -> userLabel = "SHOP_MNG";
                    case "VENDOR" -> userLabel = "VEND";
                    case "GUEST" -> userLabel = "GUEST";
                    case "WAREHOUSE_MANAGER" -> userLabel = "WM";
                    default -> userLabel = "U";
                }

                // Count existing users with this prefix and compute next sequence number
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

        // 2. Create UserAuth
        UserAuth auth = UserAuth.builder()
                .authId(UUID.randomUUID().toString())
                .userId(profile.getUserId())
                .provider("LOCAL")
                .passwordHash(passwordEncoder.encode(request.password()))
                .createdAt(LocalDateTime.now())
                .build();
        authRepo.save(auth);

        // 3. Assign role according to request (role is an enum shown as dropdown in Swagger)
                String prefix;
                switch (request.role().name()) {
                    case "ADMIN" -> prefix = "AD";
                    case "CUSTOMER" -> prefix = "C";
                    case "SHOP_MANAGER" -> prefix = "S";
                    case "VENDOR" -> prefix = "V";
                    case "GUEST" -> prefix = "G";
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

        // Return a JSON object with message and assigned userId so Swagger "Try it out"
        // can parse the response as JSON instead of raw text.
        RegistrationResponse resp = RegistrationResponse.builder()
                .message("Registration successful")
                .userId(profile.getUserId())
                .build();

        return ResponseEntity.ok(resp);
    }
}