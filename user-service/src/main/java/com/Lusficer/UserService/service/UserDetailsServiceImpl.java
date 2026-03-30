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

    /**
     * Loads user details for Spring Security authentication.
     * Accepts both email (for login) and userId (for token auth).
     * Returns UserDetails with userId as principal and assigned roles.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserProfile profile = profileRepo.findById(username)
                .orElseGet(() -> profileRepo.findByEmail(username)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username)));

        UserAuth auth = authRepo.findByUserId(profile.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("Auth not found"));

        var authorities = roleRepo.findByUserId(profile.getUserId()).stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
                .collect(Collectors.toList());

        return User.builder()
                .username(profile.getUserId())
                .password(auth.getPasswordHash())
                .authorities(authorities)
                .build();
    }
}

