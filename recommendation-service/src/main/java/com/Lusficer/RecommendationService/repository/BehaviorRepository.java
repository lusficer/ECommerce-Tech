package com.Lusficer.RecommendationService.repository;

import com.Lusficer.RecommendationService.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface BehaviorRepository extends JpaRepository<UserBehaviorLog, Long> {
    List<UserBehaviorLog> findByUserIdAndCreatedAtAfter(String userId, LocalDateTime date);
}