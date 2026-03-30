package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserRole;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, String> {
    /**
     * Finds the primary role for a user.
     */
    Optional<UserRole> findByUserId(String userId);

    /**
     * Finds all roles assigned to a user.
     */
    List<UserRole> findAllByUserId(String userId);
    
    /**
     * Deletes roles for a user.
     */
    void deleteByUserId(String userId);
}