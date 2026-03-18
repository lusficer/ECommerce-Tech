package com.Lusficer.ProductService.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class ReviewRequestDTO {
    @NotBlank(message = "Order ID is required to verify purchase")
    private String orderId;

    @NotBlank(message = "User name is required")
    private String userName;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    private String comment;

    private List<String> images;
}