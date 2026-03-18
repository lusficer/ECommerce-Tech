package com.Lusficer.OrderService.dto.request;

import com.Lusficer.OrderService.enums.ShippingStatus;
import lombok.Data;

@Data
public class ShippingRequestDTO {
    // Không cần gửi shipperId vì ta có thể lấy từ Header/Token (nếu có Auth)
    private String orderId;
    private ShippingStatus status;
    private String note;
}