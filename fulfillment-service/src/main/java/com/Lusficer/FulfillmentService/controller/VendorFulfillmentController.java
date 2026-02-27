package com.Lusficer.FulfillmentService.controller;

import com.Lusficer.FulfillmentService.service.FulfillmentService;
import com.Lusficer.FulfillmentService.entity.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vendor/fulfillment")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Vendor Fulfillment", description = "Fulfillment operations for Vendors (Pick, Pack, Handover)")
public class VendorFulfillmentController {

    @Autowired
    private FulfillmentService service;

    @PostMapping("/{shipmentId}/pick")
    @PreAuthorize("hasRole('ROLE_VENDOR')")
    @Operation(summary = "Start Picking", description = "Mark shipment as PICKING status")
    public ResponseEntity<String> startPicking(@PathVariable("shipmentId") String shipmentId) {
        service.startPicking(shipmentId);
        return ResponseEntity.ok("Picking process started");
    }

    @PostMapping("/{shipmentId}/pack") // Đã xóa 'produces = MediaType.APPLICATION_PDF_VALUE'
    @PreAuthorize("hasAuthority('ROLE_VENDOR')")
    @Operation(summary = "Pack & Generate Label", description = "Mark shipment as PACKED and return info (JSON) for Frontend")
    public ResponseEntity<Shipment> packAndLabel(@PathVariable("shipmentId") String shipmentId) {
        return ResponseEntity.ok(service.packAndLabel(shipmentId));
    }

    @PostMapping("/{shipmentId}/handover")
    @PreAuthorize("hasRole('ROLE_VENDOR')")
    @Operation(summary = "Handover Shipment", description = "Mark shipment as HANDED_OVER to Logistics")
    public ResponseEntity<String> handover(@PathVariable("shipmentId") String shipmentId) {
        service.handover(shipmentId);
        return ResponseEntity.ok("Handed over successfully");
    }
}