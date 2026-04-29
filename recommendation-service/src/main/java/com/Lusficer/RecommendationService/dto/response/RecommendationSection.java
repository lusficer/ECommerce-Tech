package com.Lusficer.RecommendationService.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "RecommendationSection", description = "A UI section on the home recommendations page")
public class RecommendationSection {

    @Schema(
            description = "Section type enum-like string",
            example = "TRENDING",
            allowableValues = {
                    "URGENT",
                    "RECENTLY_VIEWED",
                    "FOR_YOU",
                    "TRENDING",
                    "SEARCH_RELATED",
                    "CATEGORY_PICKS"
            }
    )
    private String sectionType;

        @Schema(description = "Display title", example = "Shopping Trends")
    private String title;

    @Schema(description = "Items in this section")
    private List<RecommendationItemDto> items;
}