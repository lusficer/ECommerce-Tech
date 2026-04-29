package com.Lusficer.RecommendationService.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "RecommendationResponse", description = "Home recommendation response with ordered sections")
public class RecommendationResponse {

    private String userId;

    @Schema(description = "Strategy used to generate recommendations", example = "PERSONALIZED")
    private String strategy;

    @Schema(description = "Ordered list of sections for the home page")
    private List<RecommendationSection> sections;
}