package com.Lusficer.FulfillmentService.dto;
import lombok.Data;
import java.util.List;

@Data
public class CreateShipmentRequest {
    private String orderId;
    private String shopId;
    private String vendorId;
    private List<ItemDto> items;

    @Data
    public static class ItemDto {
        private String productId;
        private String productName;
        private int quantity;
    }
}