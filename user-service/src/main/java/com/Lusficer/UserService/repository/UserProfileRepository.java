package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserProfile;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
    Optional<UserProfile> findByEmail(String email);
    Optional<UserProfile> findByUserId(String userId);
    long countByUserIdStartingWith(String prefix);

}