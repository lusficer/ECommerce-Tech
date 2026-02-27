// File: OrderAddressRequest.java
package com.Lusficer.OrderService.dto.request;
import lombok.Data;

@Data
public class OrderAddressRequest {
    private String fullName;
    private String phone;
    private String addressLine;
    private String city;
    private String district;
    private String ward;
}