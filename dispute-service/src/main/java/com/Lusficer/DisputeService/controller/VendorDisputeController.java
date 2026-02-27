package com.Lusficer.DisputeService.controller;

import com.Lusficer.DisputeService.dto.CreateDisputeRequest;
import com.Lusficer.DisputeService.dto.EvidenceDTO;
import com.Lusficer.DisputeService.entity.Dispute;
import com.Lusficer.DisputeService.service.DisputeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/vendor/disputes")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Vendor Dispute", description = "Disputes management for vendors (Vendor only)")
public class VendorDisputeController {

    @Autowired
    private DisputeService disputeService;

    // UC: Submit Order Dispute
    @PostMapping
    public ResponseEntity<Dispute> createDispute(
            @RequestHeader("X-User-Id") String vendorId,
            @RequestBody CreateDisputeRequest request) {
        return ResponseEntity.ok(disputeService.createDispute(vendorId, request));
    }

    // UC: Provide Evidence/Response
    @PostMapping("/{disputeId}/evidence")
    @PreAuthorize("hasRole('ROLE_VENDOR')")
    public ResponseEntity<String> addEvidence(
            @RequestHeader("X-User-Id") String vendorId,
            @Parameter(description = "Dispute ID", required = true, example = "DISP-001")
            @PathVariable("disputeId") String disputeId,
            @RequestBody EvidenceDTO evidenceDTO) {
        disputeService.addEvidence(disputeId, vendorId, evidenceDTO);
        return ResponseEntity.ok("Evidence added successfully");
    }

    // UC: View Dispute Status
    @GetMapping("/{disputeId}")
    @PreAuthorize("hasRole('ROLE_VENDOR')")
    public ResponseEntity<Dispute> getDispute(
            @PathVariable("disputeId") String disputeId) {
        return ResponseEntity.ok(disputeService.getDisputeDetails(disputeId));
    }
}