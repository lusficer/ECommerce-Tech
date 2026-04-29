package com.Lusficer.OrderService.dto.response;

import com.Lusficer.OrderService.enums.ShippingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ShippingPhotoDTO {
    private Long id;
    private Long shippingId;
    private String photoUrl;
    private ShippingStatus photoType;
    private LocalDateTime uploadedAt;
}