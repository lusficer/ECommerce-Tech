package com.Lusficer.FulfillmentService.dto;
import lombok.Data;
import java.util.Map;

@Data
public class VerificationResultDTO {
    // Key: productId, Value: true (pass) / false (fail)
    private Map<String, Boolean> itemResults;
    private String globalNote;
}