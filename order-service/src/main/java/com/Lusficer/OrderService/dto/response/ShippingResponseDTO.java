package com.Lusficer.OrderService.dto.response;

import com.Lusficer.OrderService.enums.ShippingStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ShippingResponseDTO {
    private Long shippingId;
    private String orderId;
    private String shipperId;
    private ShippingStatus status;
    private String note;
    private LocalDateTime updatedAt;
}