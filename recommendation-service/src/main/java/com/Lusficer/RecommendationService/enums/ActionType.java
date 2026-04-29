package com.Lusficer.RecommendationService.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ActionType {
    VIEW,           // (1 points)
    SEARCH,         // (1.5 points)
    ADD_TO_CART,    // (5 points)
    WISHLIST,       // (10 points)
    PURCHASED       // (-10 points)

    ;

    @JsonCreator
    public static ActionType fromJson(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toUpperCase();

        // Backward/forward compatible aliases (mobile/web tracking often uses these)
        return switch (normalized) {
            case "DWELL" -> VIEW;
            case "PURCHASE" -> PURCHASED;
            default -> ActionType.valueOf(normalized);
        };
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}