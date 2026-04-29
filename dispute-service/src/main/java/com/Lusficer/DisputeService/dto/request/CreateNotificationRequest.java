package com.Lusficer.DisputeService.dto.request;

import com.Lusficer.DisputeService.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    private String userId;
    private String targetRole;
    private String shopId;
    private NotificationType type;
    private String title;
    private String message;
    private String referenceId;
    private String referenceType;
}
