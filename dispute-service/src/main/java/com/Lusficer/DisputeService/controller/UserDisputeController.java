package com.Lusficer.DisputeService.controller;

import com.Lusficer.DisputeService.dto.CreateDisputeRequest;
import com.Lusficer.DisputeService.dto.EvidenceDTO;
import com.Lusficer.DisputeService.entity.Dispute;
import com.Lusficer.DisputeService.service.DisputeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/user/disputes")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "User Dispute", description = "Disputes management for users (User only)")
public class UserDisputeController {

    @Autowired
    private DisputeService disputeService;

    // UC: List all disputes for a user
    @GetMapping
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Operation(summary = "List all disputes created by this user")
    public ResponseEntity<List<Dispute>> listMyDisputes(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(disputeService.getDisputesByUser(userId));
    }

    // UC: Submit Order Dispute
    @PostMapping
    public ResponseEntity<Dispute> createDispute(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Shop-Id") String shopId,
            @RequestBody CreateDisputeRequest request) {
        return ResponseEntity.ok(disputeService.createDispute(userId, shopId, request));
    }

    // UC: Provide Evidence/Response
    @PostMapping("/{disputeId}/evidence")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<String> addEvidence(
            @RequestHeader("X-User-Id") String userId,
            @Parameter(description = "Dispute ID", required = true, example = "DISP-001")
            @PathVariable("disputeId") String disputeId,
            @RequestBody EvidenceDTO evidenceDTO) {
        disputeService.addEvidence(disputeId, userId, evidenceDTO);
        return ResponseEntity.ok("Evidence added successfully");
    }

    // UC: View Dispute Status
    @GetMapping("/{disputeId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<Dispute> getDispute(
            @PathVariable("disputeId") String disputeId) {
        return ResponseEntity.ok(disputeService.getDisputeDetails(disputeId));
    }
}