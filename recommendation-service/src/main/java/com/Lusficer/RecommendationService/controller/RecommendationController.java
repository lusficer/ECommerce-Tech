package com.Lusficer.RecommendationService.controller;

import com.Lusficer.RecommendationService.dto.response.RecommendationResponse;
import com.Lusficer.RecommendationService.entity.UserBehaviorLog;
import com.Lusficer.RecommendationService.service.RecommendationService;
import com.Lusficer.RecommendationService.dto.request.TrackingRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Token")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping("/track")
    public ResponseEntity<String> trackUserBehavior(@RequestBody TrackingRequest request) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        UserBehaviorLog log = UserBehaviorLog.builder()
                .userId(currentUserId)
                .productId(request.getProductId())
                .categoryId(request.getCategoryId())
                .actionType(request.getActionType())
                .searchKeyword(request.getSearchKeyword())
                .dwellTimeMs(request.getDwellTimeMs())
                .build();
        
        recommendationService.trackBehavior(log);
        
        return ResponseEntity.ok("Logged behavior for user: " + currentUserId);
    }

    @GetMapping("/home")
    public ResponseEntity<RecommendationResponse> getHomeRecommendations() {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(recommendationService.getSmartRecommendations(currentUserId));
    }
}