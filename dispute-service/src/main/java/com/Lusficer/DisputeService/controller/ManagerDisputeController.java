package com.Lusficer.DisputeService.controller;

import com.Lusficer.DisputeService.dto.ResolveDisputeRequest;
import com.Lusficer.DisputeService.entity.Dispute;
import com.Lusficer.DisputeService.service.DisputeService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/manager/disputes")
@SecurityRequirement(name = "Bearer Token")
@PreAuthorize("hasRole('ROLE_SHOP_MANAGER')")
public class ManagerDisputeController {

    @Autowired
    private DisputeService disputeService;

    // UC: Review Order Dispute
    @GetMapping("/{disputeId}")
    public ResponseEntity<Dispute> reviewDispute(@PathVariable("disputeId") String disputeId) {
        return ResponseEntity.ok(disputeService.getDisputeDetails(disputeId));
    }

    // UC: Request Additional Information
    @PostMapping("/{disputeId}/request-info")
    public ResponseEntity<String> requestInfo(
            @RequestHeader("X-User-Id") String managerId,
            @PathVariable("disputeId") String disputeId,
            @RequestBody Map<String, String> payload) { // payload: {"message": "..."}
        disputeService.requestAdditionalInfo(disputeId, managerId, payload.get("message"));
        return ResponseEntity.ok("Request sent to vendor");
    }

    @PostMapping("/{disputeId}/resolve")
    public ResponseEntity<String> resolveDispute(
            @RequestHeader("X-User-Id") String managerId,
            @PathVariable("disputeId") String disputeId,
            @RequestBody ResolveDisputeRequest request) {
        request.setManagerId(managerId);
        disputeService.resolveDispute(disputeId, request);
        return ResponseEntity.ok("Dispute resolved");
    }
}