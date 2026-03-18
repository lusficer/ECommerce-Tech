package com.Lusficer.ProductService.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder
public class ReviewResponseDTO {
    private Long reviewId;
    private String userId;
    private String userName;
    private Integer rating;
    private String comment;
    private List<String> images;
    private LocalDateTime createdAt;
}