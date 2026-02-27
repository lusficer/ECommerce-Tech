package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.UserPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPaymentRepository extends JpaRepository<UserPayment, String> {
    void deleteByUserId(String userId);
}