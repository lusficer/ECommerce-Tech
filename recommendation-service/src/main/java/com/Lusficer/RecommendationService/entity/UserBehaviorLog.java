package com.Lusficer.RecommendationService.entity;

import com.Lusficer.RecommendationService.enums.ActionType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_behavior_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserBehaviorLog {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "logId")
    private Long logId;

    @Column(name = "userId")
    private String userId;

    @Column(name = "productId")
    private String productId;

    @Column(name = "categoryId")
    private String categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "actionType")
    private ActionType actionType;

    @Column(name = "searchKeyword")
    private String searchKeyword; 

    @Column(name = "dwellTimeMs")
    private Integer dwellTimeMs;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}