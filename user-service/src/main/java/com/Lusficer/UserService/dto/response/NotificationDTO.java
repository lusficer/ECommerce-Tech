package com.Lusficer.UserService.dto.response;

import com.Lusficer.UserService.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    private Long notificationId;
    private NotificationType type;
    private String title;
    private String message;
    private String referenceId;
    private String referenceType;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
