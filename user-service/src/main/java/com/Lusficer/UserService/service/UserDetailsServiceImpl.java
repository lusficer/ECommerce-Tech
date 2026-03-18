// user-service/src/main/java/com/Lusficer/UserService/service/UserDetailsServiceImpl.java
package com.Lusficer.UserService.service;

import com.Lusficer.UserService.entity.UserAuth;
import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.repository.UserAuthRepository;
import com.Lusficer.UserService.repository.UserProfileRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserProfileRepository profileRepo;
    private final UserAuthRepository authRepo;
    private final UserRoleRepository roleRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Algorithm for resolving UserDetails used by Spring Security:
        // 1) Look up the user profile by email OR userId. The system accepts both:
        //    - Email for initial login
        //    - UserId for token-based authentication
        // 2) Load the authentication record (password hash) by the resolved
        //    userId (profile.getUserId()).
        // 3) Load all roles for the user and map them to SimpleGrantedAuthority
        //    with the "ROLE_" prefix required by Spring Security.
        // 4) Return a Spring Security `User` where we store userId as the
        //    username (so downstream code that calls Authentication#getName()
        //    receives the internal userId rather than email). This decouples
        //    external login identifier (email) from the internal principal id.

        UserProfile profile = profileRepo.findById(username)  // Try userId first
                .orElseGet(() -> profileRepo.findByEmail(username)  // Then try email
                        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username)));

        UserAuth auth = authRepo.findByUserId(profile.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("Auth not found"));

        var authorities = roleRepo.findByUserId(profile.getUserId()).stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
                .collect(Collectors.toList());

        return User.builder()
                .username(profile.getUserId())  // use internal userId as principal
                .password(auth.getPasswordHash())
                .authorities(authorities)
                .build();
    }
}

