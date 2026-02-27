package com.Lusficer.RecommendationService.service;

import com.Lusficer.RecommendationService.client.InventoryClient;
import com.Lusficer.RecommendationService.client.ProductClient;
import com.Lusficer.RecommendationService.dto.ProductDto;
import com.Lusficer.RecommendationService.dto.response.RecommendationItemDto;
import com.Lusficer.RecommendationService.dto.response.RecommendationResponse;
import com.Lusficer.RecommendationService.entity.UserBehaviorLog;
import com.Lusficer.RecommendationService.enums.ActionType;
import com.Lusficer.RecommendationService.repository.BehaviorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final BehaviorRepository behaviorRepository;
    private final InventoryClient inventoryClient;
    private final ProductClient productClient;

    // 1. Log User Behavior (Called implicitly by Frontend)
    public void trackBehavior(UserBehaviorLog log) {
        if (log.getActionType() == ActionType.VIEW && log.getDwellTimeMs() > 30000) {
            log.setActionType(ActionType.LONG_VIEW);
        }
        behaviorRepository.save(log);
    }

    // 2. Smart Recommendations (Called by Home Page)
    public RecommendationResponse getSmartRecommendations(String userId) {
        // B1: Lấy lịch sử 7 ngày qua
        List<UserBehaviorLog> logs = behaviorRepository.findByUserIdAndCreatedAtAfter(
                userId, LocalDateTime.now().minusDays(7));

        if (logs.isEmpty()) return getTrendingFallback(userId);

        // --- LOGIC 1: TÍNH ĐIỂM HÀNH VI (Weighted Score) ---
        Map<String, Double> productScores = calculateScores(logs);
        
        // Lấy Top 5 sản phẩm tương tác nhiều nhất (Direct Interaction)
        List<String> topInteractionIds = productScores.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // --- LOGIC 2: PHÂN TÍCH TỪ KHÓA TÌM KIẾM (Search Intent) ---
        // Lấy từ khóa được search gần đây nhất
        String lastSearchKeyword = logs.stream()
                .filter(log -> log.getActionType() == ActionType.SEARCH && log.getSearchKeyword() != null)
                .sorted(Comparator.comparing(UserBehaviorLog::getCreatedAt).reversed())
                .map(UserBehaviorLog::getSearchKeyword)
                .findFirst()
                .orElse(null);

        List<ProductDto> searchRelatedProducts = new ArrayList<>();
        if (lastSearchKeyword != null) {
            // Gọi Product Service để tìm các sản phẩm liên quan từ khóa (VD: "Samsung")
            searchRelatedProducts = safeSearchProducts(lastSearchKeyword);
        }

        // --- LOGIC 3: TRỘN DANH SÁCH (MERGE) ---
        // Ta cần gộp ID từ Interaction và ID từ Search Result lại
        Set<String> allProductIds = new HashSet<>(topInteractionIds);
        searchRelatedProducts.forEach(p -> allProductIds.add(p.getProductId()));

        if (allProductIds.isEmpty()) return getTrendingFallback(userId);

        // B4: Enrich Data & Check Stock (Cho tất cả ID)
        List<String> finalIdList = new ArrayList<>(allProductIds);
        List<ProductDto> productsInfo = safeGetProducts(finalIdList);
        Map<String, Integer> stockStatus = safeCheckStock(finalIdList);
        
        Map<String, ProductDto> productMap = productsInfo.stream()
                .collect(Collectors.toMap(ProductDto::getProductId, Function.identity()));

        // B5: Build Response
        List<RecommendationItemDto> urgentList = new ArrayList<>();
        List<RecommendationItemDto> regularList = new ArrayList<>();

        for (String pid : finalIdList) {
            ProductDto pInfo = productMap.get(pid);
            if (pInfo == null) continue;
            
            int stock = stockStatus.getOrDefault(pid, 0);
            if (stock <= 0) continue; 

            RecommendationItemDto item = RecommendationItemDto.builder()
                    .productId(pid)
                    .name(pInfo.getName())
                    .imageUrl(pInfo.getImageUrl())
                    .price(pInfo.getPrice())
                    .stockLeft(stock)
                    .build();

            // Xác định Badge & Reason
            double score = productScores.getOrDefault(pid, 0.0);
            
            // Ưu tiên 1: FOMO (Thích nhiều + Kho ít)
            if (score >= 5.0 && stock <= 3) {
                item.setBadge("ALMOST SOLD OUT");
                item.setReason("Only " + stock + " left! You liked this!");
                urgentList.add(item);
            } 
            // Ưu tiên 2: Hàng liên quan đến Search (Nếu user chưa từng tương tác nhưng có trong kq search)
            else if (score == 0.0 && lastSearchKeyword != null && pInfo.getName().toLowerCase().contains(lastSearchKeyword.toLowerCase())) {
                item.setReason("Because you searched for \"" + lastSearchKeyword + "\"");
                regularList.add(item);
            } 
            // Ưu tiên 3: Hàng thường (Dựa trên view/click cũ)
            else {
                item.setReason("Based on your interest");
                regularList.add(item);
            }
        }
        
        // Sắp xếp lại Regular List: Đưa hàng Search lên đầu để user thấy độ "thông minh"
        regularList.sort((p1, p2) -> {
            boolean p1IsSearch = p1.getReason().contains("searched for");
            boolean p2IsSearch = p2.getReason().contains("searched for");
            return Boolean.compare(p2IsSearch, p1IsSearch); // True lên trước
        });

        return RecommendationResponse.builder()
                .userId(userId)
                .strategy("HYBRID_INTERACTION_AND_SEARCH")
                .urgentItems(urgentList)
                .suggestedItems(regularList)
                .build();
    }

    // Helper method wrapper
    private List<ProductDto> safeSearchProducts(String keyword) {
        try { return productClient.searchProducts(keyword); } 
        catch (Exception e) { return Collections.emptyList(); }
    }

    private Map<String, Double> calculateScores(List<UserBehaviorLog> logs) {
        Map<String, Double> scores = new HashMap<>();
        for (UserBehaviorLog log : logs) {
            if (log.getProductId() == null) continue;
            double points = switch (log.getActionType()) {
                case VIEW -> 1.0;
                case SEARCH -> 1.5;
                case LONG_VIEW -> 3.0;
                case ADD_TO_CART -> 5.0;
                case PURCHASED -> -10.0;
            };
            scores.merge(log.getProductId(), points, Double::sum);
        }
        return scores;
    }

    private RecommendationResponse getTrendingFallback(String userId) {
        List<ProductDto> trending = safeGetTrending();
        List<RecommendationItemDto> items = trending.stream()
                .map(p -> RecommendationItemDto.builder()
                        .productId(p.getProductId())
                        .name(p.getName())
                        .imageUrl(p.getImageUrl())
                        .price(p.getPrice())
                        .badge("TRENDING")
                        .reason("Hottest products of the week")
                        .build())
                .collect(Collectors.toList());

        return RecommendationResponse.builder()
                .userId(userId)
                .strategy("COLD_START_TRENDING")
                .urgentItems(Collections.emptyList())
                .suggestedItems(items)
                .build();
    }
    
    // Wrapper to prevent crash if downstream service is down
    private List<ProductDto> safeGetProducts(List<String> ids) {
        try { return productClient.getProductsByIds(ids); } 
        catch (Exception e) { return Collections.emptyList(); }
    }
    private List<ProductDto> safeGetTrending() {
        try { return productClient.getTrendingProducts(); } 
        catch (Exception e) { return Collections.emptyList(); }
    }
    private Map<String, Integer> safeCheckStock(List<String> ids) {
        try { return inventoryClient.checkStockBatch(ids); } 
        catch (Exception e) { return new HashMap<>(); }
    }
}