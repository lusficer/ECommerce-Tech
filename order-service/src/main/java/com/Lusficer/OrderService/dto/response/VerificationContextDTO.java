package com.Lusficer.OrderService.dto.response;

import com.Lusficer.OrderService.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class VerificationContextDTO {

    private String orderId;

    // Payment Verification
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private String paymentRiskLevel; // LOW / MEDIUM / HIGH

    // Fraud Signals
    private boolean isNewAccount;
    private long recentOrderCount;
    private long recentCancelCount;
    private boolean hasDisputeHistory;
    private boolean addressMismatch;
    private int fraudScore;          // 0-100
    private String riskLevel;        // LOW / MEDIUM / HIGH

    // Order Summary
    private BigDecimal grandTotal;
    private List<OrderItemSummaryDTO> items;
    private OrderAddressSummaryDTO address;

    @Data
    @Builder
    public static class OrderItemSummaryDTO {
        private String productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    public static class OrderAddressSummaryDTO {
        private String fullName;
        private String phone;
        private String addressLine;
        private String city;
        private String district;
        private String ward;
    }
}
