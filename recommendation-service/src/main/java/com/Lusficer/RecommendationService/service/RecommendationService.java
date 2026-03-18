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

    public void trackBehavior(UserBehaviorLog log) {
        behaviorRepository.save(log);
    }

    public RecommendationResponse getSmartRecommendations(String userId) {
        List<UserBehaviorLog> logs = behaviorRepository.findByUserIdAndCreatedAtAfter(
                userId, LocalDateTime.now().minusDays(7));

        if (logs.isEmpty()) return getTrendingFallback(userId);

        Map<String, Double> productScores = new HashMap<>();
        Map<String, Double> categoryScores = new HashMap<>();

        for (UserBehaviorLog log : logs) {
            double points = switch (log.getActionType()) {
                case VIEW -> 1.0;
                case SEARCH -> 1.5;
                case WISHLIST -> 4.0;
                case ADD_TO_CART -> 5.0;
                case PURCHASED -> -10.0;
                default -> 0.0;
            };
            
            if (log.getProductId() != null) {
                productScores.merge(log.getProductId(), points, Double::sum);
            }
            if (log.getCategoryId() != null) {
                categoryScores.merge(log.getCategoryId(), points, Double::sum);
            }
        }

        List<String> topInteractionIds = productScores.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        String lastSearchKeyword = logs.stream()
                .filter(log -> log.getActionType() == ActionType.SEARCH && log.getSearchKeyword() != null)
                .sorted(Comparator.comparing(UserBehaviorLog::getCreatedAt).reversed())
                .map(UserBehaviorLog::getSearchKeyword)
                .findFirst()
                .orElse(null);

        List<ProductDto> searchRelatedProducts = lastSearchKeyword != null 
                ? safeSearchProducts(lastSearchKeyword) 
                : new ArrayList<>();

        String favoriteCategory = categoryScores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .filter(e -> e.getValue() > 0)
                .map(Map.Entry::getKey)
                .orElse(null);

        List<ProductDto> categoryProducts = favoriteCategory != null 
                ? safeGetCategoryProducts(favoriteCategory) 
                : new ArrayList<>();
        
        Set<String> categoryProductIds = categoryProducts.stream()
                .map(ProductDto::getProductId).collect(Collectors.toSet());

        Set<String> allProductIds = new LinkedHashSet<>(topInteractionIds);
        searchRelatedProducts.forEach(p -> allProductIds.add(p.getProductId()));
        categoryProducts.forEach(p -> allProductIds.add(p.getProductId()));

        if (allProductIds.isEmpty()) return getTrendingFallback(userId);

        List<String> finalIdList = new ArrayList<>(allProductIds);
        List<ProductDto> productsInfo = safeGetProducts(finalIdList);
        Map<String, Integer> stockStatus = safeCheckStock(finalIdList);
        Map<String, ProductDto> productMap = productsInfo.stream()
                .collect(Collectors.toMap(ProductDto::getProductId, Function.identity()));

        List<RecommendationItemDto> urgentList = new ArrayList<>();
        List<RecommendationItemDto> regularList = new ArrayList<>();

        for (String pid : finalIdList) {
            ProductDto pInfo = productMap.get(pid);
            if (pInfo == null) continue;
            
            int stock = stockStatus.getOrDefault(pid, 0);
            if (stock <= 0) continue;

            RecommendationItemDto item = RecommendationItemDto.builder()
                    .productId(pid).name(pInfo.getName()).mainImage(pInfo.getMainImage())
                    .price(pInfo.getPrice()).stockLeft(stock).build();

            double score = productScores.getOrDefault(pid, 0.0);
            
            if (score >= 4.0 && stock <= 3) {
                item.setBadge("ALMOST SOLD OUT");
                item.setReason("Only " + stock + " left! You liked this!");
                urgentList.add(item);
            } 
            else if (score > 0.0) {
                item.setReason("Based on your interest");
                regularList.add(item);
            }
            else if (lastSearchKeyword != null && pInfo.getName().toLowerCase().contains(lastSearchKeyword.toLowerCase())) {
                item.setReason("Because you searched for \"" + lastSearchKeyword + "\"");
                regularList.add(item);
            } 
            else if (categoryProductIds.contains(pid)) {
                item.setReason("Similar items you might like");
                regularList.add(item);
            }
        }
        
        regularList.sort(Comparator.comparingInt(p -> getPriorityRank(p.getReason())));

        if (urgentList.isEmpty() && regularList.isEmpty()) {
            return getTrendingFallback(userId);
        }

        return RecommendationResponse.builder()
                .userId(userId).strategy("HYBRID_ADVANCED")
                .urgentItems(urgentList).suggestedItems(regularList)
                .build();
    }

    private int getPriorityRank(String reason) {
        if (reason == null) return 4;
        if (reason.contains("Based on your interest")) return 1;
        if (reason.contains("searched for")) return 2;
        if (reason.contains("Similar items")) return 3;
        return 4;
    }

    private List<ProductDto> safeSearchProducts(String keyword) {
        try { return productClient.searchProducts(keyword); } 
        catch (Exception e) { return Collections.emptyList(); }
    }

    private List<ProductDto> safeGetCategoryProducts(String categoryId) {
        try { return productClient.getProductsByCategory(categoryId); } 
        catch (Exception e) { return Collections.emptyList(); }
    }

    private RecommendationResponse getTrendingFallback(String userId) {
        List<ProductDto> trending = safeGetTrending();
        List<RecommendationItemDto> items = trending.stream()
                .map(p -> RecommendationItemDto.builder()
                        .productId(p.getProductId())
                        .name(p.getName())
                        .mainImage(p.getMainImage())
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