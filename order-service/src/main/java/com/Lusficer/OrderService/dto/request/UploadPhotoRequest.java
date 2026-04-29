package com.Lusficer.OrderService.dto.request;

import com.Lusficer.OrderService.enums.ShippingStatus;
import lombok.Data;

@Data
public class UploadPhotoRequest {
    private ShippingStatus photoType; // PICKING_UP, DELIVERED, FAILED, RETURNED
}