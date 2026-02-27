package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserRole;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, String> {
    Optional<UserRole> findByUserId(String userId);

    // (Tùy bạn có thể muốn lấy nhiều role cho 1 user thì có thể dùng List)
    List<UserRole> findAllByUserId(String userId);
    
    void deleteByUserId(String userId);
}