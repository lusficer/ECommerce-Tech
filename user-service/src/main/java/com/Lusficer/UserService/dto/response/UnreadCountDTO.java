package com.Lusficer.UserService.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnreadCountDTO {
    
    /**
     * Total number of unread notifications
     */
    private Long totalUnread;
    
    /**
     * Count grouped by notification type
     * Example: {"ORDER_STATUS_CHANGED": 3, "LOW_STOCK_WARNING": 1}
     */
    private Map<String, Long> countByType;
}
