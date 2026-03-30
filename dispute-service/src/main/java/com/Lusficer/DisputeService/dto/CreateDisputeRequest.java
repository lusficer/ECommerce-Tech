package com.Lusficer.DisputeService.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateDisputeRequest {
    private String orderId;
    private String reason; // String mapped to enum
    private String description;
    private List<EvidenceDTO> initialEvidence;
}
