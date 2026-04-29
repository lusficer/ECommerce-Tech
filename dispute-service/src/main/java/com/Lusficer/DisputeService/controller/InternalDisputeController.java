package com.Lusficer.DisputeService.controller;

import com.Lusficer.DisputeService.repository.DisputeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/disputes")
@RequiredArgsConstructor
@Tag(name = "Internal Dispute", description = "Internal service-to-service dispute APIs")
public class InternalDisputeController {

    private final DisputeRepository disputeRepository;

    @GetMapping("/user/{userId}/exists")
    @Operation(summary = "Check whether a user has any dispute history")
    public ResponseEntity<Boolean> userHasDispute(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(disputeRepository.existsByUserId(userId));
    }
}
