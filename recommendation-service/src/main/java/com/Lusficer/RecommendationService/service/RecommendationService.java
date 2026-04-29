package com.Lusficer.RecommendationService.service;

import com.Lusficer.RecommendationService.client.InventoryClient;
import com.Lusficer.RecommendationService.client.ProductClient;
import com.Lusficer.RecommendationService.dto.ProductDto;
import com.Lusficer.RecommendationService.dto.response.RecommendationItemDto;
import com.Lusficer.RecommendationService.dto.response.RecommendationResponse;
import com.Lusficer.RecommendationService.dto.response.RecommendationSection;
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

    /**
     * Persists a user behavior event used for recommendation signals.
     */
    public void trackBehavior(UserBehaviorLog log) {
        behaviorRepository.save(log);
    }

    /**
     * Builds a hybrid recommendation response with ordered sections:
     * URGENT -> RECENTLY_VIEWED -> FOR_YOU -> SEARCH_RELATED -> CATEGORY_PICKS -> TRENDING
     */
    public RecommendationResponse getSmartRecommendations(String userId) {
        List<UserBehaviorLog> logs = behaviorRepository.findByUserIdAndCreatedAtAfter(
                userId, LocalDateTime.now().minusDays(7));

        // Cold-start: only TRENDING
        if (logs.isEmpty()) {
            return getTrendingFallback(userId);
        }

        // ===== Keep scoring logic unchanged =====
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

        // Most recent search keyword (for SEARCH_RELATED section)
        String lastSearchKeyword = logs.stream()
                .filter(l -> l.getActionType() == ActionType.SEARCH
                        && l.getSearchKeyword() != null
                        && !l.getSearchKeyword().isBlank())
                .sorted(Comparator.comparing(UserBehaviorLog::getCreatedAt).reversed())
                .map(UserBehaviorLog::getSearchKeyword)
                .findFirst()
                .orElse(null);

        List<ProductDto> searchRelatedProducts = lastSearchKeyword != null
                ? safeSearchProducts(lastSearchKeyword)
                : Collections.emptyList();

        // Favorite category (for CATEGORY_PICKS section)
        String favoriteCategory = categoryScores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .filter(e -> e.getValue() > 0)
                .map(Map.Entry::getKey)
                .orElse(null);

        List<ProductDto> categoryProducts = favoriteCategory != null
                ? safeGetCategoryProducts(favoriteCategory)
                : Collections.emptyList();

        // Always fetch trending (TRENDING section always present)
        List<ProductDto> trendingProducts = safeGetTrending();

        // Recently viewed (RECENTLY_VIEWED section)
        List<String> recentlyViewedIds = logs.stream()
                .filter(l -> l.getActionType() == ActionType.VIEW && l.getProductId() != null)
                .sorted(Comparator.comparing(UserBehaviorLog::getCreatedAt).reversed())
                .map(UserBehaviorLog::getProductId)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());

        // FOR_YOU candidate ids by score desc
        List<String> forYouIds = productScores.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Build hydrate ids for non-trending sections (product info)
        LinkedHashSet<String> hydrateIds = new LinkedHashSet<>();
        hydrateIds.addAll(forYouIds);
        searchRelatedProducts.forEach(p -> {
            if (p != null && p.getProductId() != null) hydrateIds.add(p.getProductId());
        });
        categoryProducts.forEach(p -> {
            if (p != null && p.getProductId() != null) hydrateIds.add(p.getProductId());
        });

        List<ProductDto> hydrated = hydrateIds.isEmpty()
                ? Collections.emptyList()
                : safeGetProducts(new ArrayList<>(hydrateIds));

        Map<String, ProductDto> hydratedMap = hydrated.stream()
                .filter(p -> p.getProductId() != null)
                .collect(Collectors.toMap(ProductDto::getProductId, Function.identity(), (a, b) -> a));

        // Stock batch check ONCE for all sections EXCEPT recently viewed
        // (include trending ids too, but limit to 10 for home)
        List<String> trendingIdsForHome = trendingProducts.stream()
                .map(ProductDto::getProductId)
                .filter(Objects::nonNull)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());

        LinkedHashSet<String> stockCheckIds = new LinkedHashSet<>();
        stockCheckIds.addAll(hydrateIds);
        stockCheckIds.addAll(trendingIdsForHome);

        Map<String, Integer> stockStatus = stockCheckIds.isEmpty()
                ? Collections.emptyMap()
                : safeCheckStock(new ArrayList<>(stockCheckIds));

        Set<String> usedProductIds = new HashSet<>();
        List<RecommendationSection> sections = new ArrayList<>();

        // =========================
        // 1) URGENT (score >= 4.0 && stock <= 50)
        // =========================
        List<RecommendationItemDto> urgentItems = new ArrayList<>();
        for (String pid : forYouIds) {
            if (pid == null || usedProductIds.contains(pid)) continue;

            ProductDto pInfo = hydratedMap.get(pid);
            if (pInfo == null) continue;

            Integer stock = stockStatus.get(pid);
            // Filter out stock <= 0 (non-recent sections)
            if (stock != null && stock <= 0) continue;

            double score = productScores.getOrDefault(pid, 0.0);
            if (score < 4.0) continue;

            // Need stock to evaluate <=3; if unknown, don't place in URGENT
            if (stock == null) continue;

            if (stock <= 50) {
                RecommendationItemDto item = baseItem(pInfo, stock);
                item.setBadge("ALMOST SOLD OUT");
                item.setReason("Only " + stock + " left! You liked this!");
                urgentItems.add(item);
                usedProductIds.add(pid);
            }
        }

        if (!urgentItems.isEmpty()) {
            sections.add(RecommendationSection.builder()
                    .sectionType("URGENT")
                    .title("Almost Sold Out — You May Like")
                    .items(urgentItems)
                    .build());
        }

        // =========================
        // 2) RECENTLY_VIEWED (no stock call, no filtering; show again even if OOS)
        // =========================
        if (!recentlyViewedIds.isEmpty()) {
            List<ProductDto> viewedHydrated = safeGetProducts(recentlyViewedIds);
            Map<String, ProductDto> viewedMap = viewedHydrated.stream()
                    .filter(p -> p.getProductId() != null)
                    .collect(Collectors.toMap(ProductDto::getProductId, Function.identity(), (a, b) -> a));

            List<RecommendationItemDto> recentlyViewedItems = new ArrayList<>();
            for (String pid : recentlyViewedIds) {
                if (pid == null || usedProductIds.contains(pid)) continue;

                ProductDto pInfo = viewedMap.get(pid);
                if (pInfo == null) continue;

                RecommendationItemDto item = baseItem(pInfo, null);
                item.setReason("You viewed this recently");

                // Do NOT call inventory for recently viewed.
                // If we already know stock from other sections, optionally set badge.
                Integer knownStock = stockStatus.get(pid);
                if (knownStock != null) {
                    item.setStockLeft(knownStock);
                    if (knownStock <= 0) {
                        item.setBadge("Out of Stock");
                    }
                }

                recentlyViewedItems.add(item);
                usedProductIds.add(pid);
            }

            if (!recentlyViewedItems.isEmpty()) {
                sections.add(RecommendationSection.builder()
                        .sectionType("RECENTLY_VIEWED")
                        .title("Recently Viewed")
                        .items(recentlyViewedItems)
                        .build());
            }
        }

        // =========================
        // 3) FOR_YOU (score > 0, not in urgent, stock > 0)
        // =========================
        List<RecommendationItemDto> forYouItems = new ArrayList<>();
        for (String pid : forYouIds) {
            if (pid == null || usedProductIds.contains(pid)) continue;

            ProductDto pInfo = hydratedMap.get(pid);
            if (pInfo == null) continue;

            Integer stock = stockStatus.get(pid);
            if (stock != null && stock <= 0) continue;

            double score = productScores.getOrDefault(pid, 0.0);
            if (score <= 0.0) continue;

            RecommendationItemDto item = baseItem(pInfo, stock);
            item.setReason("Based on your interest");
            forYouItems.add(item);
            usedProductIds.add(pid);
        }

        if (!forYouItems.isEmpty()) {
            sections.add(RecommendationSection.builder()
                    .sectionType("FOR_YOU")
                    .title("For You")
                    .items(forYouItems)
                    .build());
        }

        // =========================
        // 4) SEARCH_RELATED (latest keyword, stock > 0)
        // =========================
        if (lastSearchKeyword != null && !lastSearchKeyword.isBlank() && !searchRelatedProducts.isEmpty()) {
            List<RecommendationItemDto> searchItems = new ArrayList<>();

            for (ProductDto p : searchRelatedProducts) {
                if (p == null || p.getProductId() == null) continue;
                String pid = p.getProductId();
                if (usedProductIds.contains(pid)) continue;

                Integer stock = stockStatus.get(pid);
                if (stock != null && stock <= 0) continue;

                // Prefer hydrated detail when available (consistent fields)
                ProductDto pInfo = hydratedMap.getOrDefault(pid, p);

                RecommendationItemDto item = baseItem(pInfo, stock);
                item.setReason("Because you searched for \"" + lastSearchKeyword + "\"");
                searchItems.add(item);
                usedProductIds.add(pid);
            }

            if (!searchItems.isEmpty()) {
                sections.add(RecommendationSection.builder()
                        .sectionType("SEARCH_RELATED")
                        .title("Related to \"" + lastSearchKeyword + "\"")
                        .items(searchItems)
                        .build());
            }
        }

        // =========================
        // 5) CATEGORY_PICKS (favorite category, stock > 0)
        // =========================
        if (favoriteCategory != null && !categoryProducts.isEmpty()) {
            List<RecommendationItemDto> categoryItems = new ArrayList<>();

            for (ProductDto p : categoryProducts) {
                if (p == null || p.getProductId() == null) continue;
                String pid = p.getProductId();
                if (usedProductIds.contains(pid)) continue;

                Integer stock = stockStatus.get(pid);
                if (stock != null && stock <= 0) continue;

                ProductDto pInfo = hydratedMap.getOrDefault(pid, p);

                RecommendationItemDto item = baseItem(pInfo, stock);
                item.setReason("Similar items you might like");
                categoryItems.add(item);
                usedProductIds.add(pid);
            }

            if (!categoryItems.isEmpty()) {
                sections.add(RecommendationSection.builder()
                        .sectionType("CATEGORY_PICKS")
                        .title("You May Also Like")
                        .items(categoryItems)
                        .build());
            }
        }

        // =========================
        // 6) TRENDING (always present, stock > 0)
        // =========================
        List<RecommendationItemDto> trendingItems = new ArrayList<>();
        for (ProductDto p : trendingProducts) {
            if (p == null || p.getProductId() == null) continue;
            String pid = p.getProductId();
            if (usedProductIds.contains(pid)) continue;

            Integer stock = stockStatus.get(pid);
            if (stock != null && stock <= 0) continue;

            RecommendationItemDto item = baseItem(p, stock);
            item.setBadge("TRENDING");
            item.setReason("Hottest products of the week");
            trendingItems.add(item);
            usedProductIds.add(pid);

            if (trendingItems.size() >= 20) break;
        }

        // TRENDING must always exist (even if empty)
        sections.add(RecommendationSection.builder()
                .sectionType("TRENDING")
            .title("Shopping Trends")
                .items(trendingItems)
                .build());

        return RecommendationResponse.builder()
                .userId(userId)
                .strategy("PERSONALIZED")
                .sections(sections)
                .build();
    }

    private RecommendationItemDto baseItem(ProductDto pInfo, Integer stockLeft) {
        return RecommendationItemDto.builder()
                .productId(pInfo.getProductId())
                .name(pInfo.getName())
                .mainImage(pInfo.getMainImage())
                .price(pInfo.getPrice())
                .stockLeft(stockLeft)
                .build();
    }

    /**
     * Safely searches products by keyword.
     */
    private List<ProductDto> safeSearchProducts(String keyword) {
        try {
            return productClient.searchProducts(keyword);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * Safely loads products in a category.
     */
    private List<ProductDto> safeGetCategoryProducts(String categoryId) {
        try {
            return productClient.getProductsByCategory(categoryId);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * Fallback for cold-start users using trending products (single TRENDING section).
     */
    private RecommendationResponse getTrendingFallback(String userId) {
        List<ProductDto> trending = safeGetTrending();

        List<String> trendingIds = trending.stream()
                .map(ProductDto::getProductId)
                .filter(Objects::nonNull)
                .distinct()
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Integer> stockStatus = trendingIds.isEmpty()
                ? Collections.emptyMap()
                : safeCheckStock(trendingIds);

        List<RecommendationItemDto> items = new ArrayList<>();
        for (ProductDto p : trending) {
            if (p == null || p.getProductId() == null) continue;
            String pid = p.getProductId();
            Integer stock = stockStatus.get(pid);

            // Filter out stock <= 0 when known
            if (stock != null && stock <= 0) continue;

            RecommendationItemDto item = baseItem(p, stock);
            item.setBadge("TRENDING");
            item.setReason("Hottest products of the week");
            items.add(item);

            if (items.size() >= 10) break;
        }

        return RecommendationResponse.builder()
                .userId(userId)
                .strategy("COLD_START_TRENDING")
                .sections(List.of(
                        RecommendationSection.builder()
                                .sectionType("TRENDING")
                        .title("Shopping Trends")
                                .items(items)
                                .build()
                ))
                .build();
    }

    /**
     * Safely loads products by id list.
     */
    private List<ProductDto> safeGetProducts(List<String> ids) {
        try {
            return productClient.getProductsByIds(ids);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * Safely loads trending products.
     */
    private List<ProductDto> safeGetTrending() {
        try {
            return productClient.getTrendingProducts();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * Safely checks stock for a batch of product ids.
     */
    private Map<String, Integer> safeCheckStock(List<String> ids) {
        try {
            return inventoryClient.checkStockBatchPost(ids);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}