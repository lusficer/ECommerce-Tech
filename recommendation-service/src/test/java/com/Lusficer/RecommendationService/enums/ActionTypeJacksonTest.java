package com.Lusficer.RecommendationService.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.Lusficer.RecommendationService.dto.request.TrackingRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ActionTypeJacksonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldDeserializeDwellAsViewAlias() throws Exception {
        TrackingRequest request = objectMapper.readValue(
                "{\"actionType\":\"DWELL\"}",
                TrackingRequest.class
        );

        assertEquals(ActionType.VIEW, request.getActionType());
    }

    @Test
    void shouldDeserializeCaseInsensitive() throws Exception {
        TrackingRequest request = objectMapper.readValue(
                "{\"actionType\":\"view\"}",
                TrackingRequest.class
        );

        assertEquals(ActionType.VIEW, request.getActionType());
    }
}
