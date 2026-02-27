package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserAuth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuthRepository extends JpaRepository<UserAuth, String> {
        Optional<UserAuth> findByUserId(String userId);

}