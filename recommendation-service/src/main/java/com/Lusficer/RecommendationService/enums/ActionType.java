package com.Lusficer.RecommendationService.enums;

public enum ActionType {
    VIEW,           // Xem lướt (1 điểm)
    LONG_VIEW,      // Xem kỹ > 30s (3 điểm)
    SEARCH,         // Tìm kiếm (1.5 điểm)
    ADD_TO_CART,    // Bỏ vào giỏ (5 điểm)
    PURCHASED       // Đã mua (-10 điểm để tránh gợi ý lại)
}