package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStatusRepository extends JpaRepository<UserStatus, String> {
}