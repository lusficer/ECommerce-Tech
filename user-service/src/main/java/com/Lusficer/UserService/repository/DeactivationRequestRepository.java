package com.Lusficer.UserService.repository;

import com.Lusficer.UserService.entity.DeactivationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeactivationRequestRepository extends JpaRepository<DeactivationRequest, Long> {
    List<DeactivationRequest> findByStatus(String status);
    List<DeactivationRequest> findByUserId(String userId);
    Optional<DeactivationRequest> findByUserIdAndStatus(String userId, String status);
}
