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
@SecurityRequirement(name = "Bearer Token") // Yêu cầu Swagger có nút Authorize
public class RecommendationController {

    private final RecommendationService recommendationService;

    // --- 1. API Tracking ---
    // User gửi log, không cần gửi userId trong body nữa, server tự điền
    @PostMapping("/track")
    public ResponseEntity<String> trackUserBehavior(@RequestBody TrackingRequest request) { // [SỬA] Nhận DTO
        
        // 1. Lấy userId từ Token (Bảo mật)
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // 2. Chuyển đổi DTO -> Entity (Mapping)
        UserBehaviorLog log = UserBehaviorLog.builder()
                .userId(currentUserId)            // Server tự điền
                .productId(request.getProductId())
                .categoryId(request.getCategoryId())
                .actionType(request.getActionType())
                .searchKeyword(request.getSearchKeyword())
                .dwellTimeMs(request.getDwellTimeMs())
                // createdAt sẽ tự tạo trong @PrePersist của Entity
                // logId sẽ tự tăng trong DB
                .build();
        
        // 3. Gọi Service lưu xuống
        recommendationService.trackBehavior(log);
        
        return ResponseEntity.ok("Logged behavior for user: " + currentUserId);
    }

    // --- 2. API Personalization (Home) ---
    // URL cũ: /api/recommendations/{userId}/home -> Dư thừa
    // URL mới: /api/recommendations/home -> Gọn gàng, bảo mật
    @GetMapping("/home")
    public ResponseEntity<RecommendationResponse> getHomeRecommendations() {
        // [QUAN TRỌNG] Lấy userId từ Token đang đăng nhập
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Gọi service với ID lấy từ Token
        return ResponseEntity.ok(recommendationService.getSmartRecommendations(currentUserId));
    }
}