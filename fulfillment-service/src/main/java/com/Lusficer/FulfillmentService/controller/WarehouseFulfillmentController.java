package com.Lusficer.FulfillmentService.controller;

import com.Lusficer.FulfillmentService.dto.VerificationResultDTO;
import com.Lusficer.FulfillmentService.service.FulfillmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/warehouse/fulfillment")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Warehouse Fulfillment", description = "Operations for Warehouse Managers (Receive, Verify, Dispatch)")
public class WarehouseFulfillmentController {

    @Autowired
    private FulfillmentService service;

    @PostMapping("/{shipmentId}/receive")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'ADMIN')")
    @Operation(summary = "Receive Shipment", description = "Scan and receive shipment from Vendor/Logistics")
    public ResponseEntity<String> receive(@PathVariable("shipmentId") String shipmentId) {
        service.receiveAtWarehouse(shipmentId);
        return ResponseEntity.ok("Shipment received at warehouse");
    }

    @PostMapping("/{shipmentId}/verify")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'ADMIN')")
    @Operation(summary = "Verify Shipment", description = "Check items and document result")
    public ResponseEntity<String> verify(@PathVariable("shipmentId") String shipmentId, @RequestBody VerificationResultDTO result) {
        service.verifyShipment(shipmentId, result);
        return ResponseEntity.ok("Verification completed");
    }

    @PostMapping("/{shipmentId}/dispatch")
    @PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER', 'ADMIN')")
    @Operation(summary = "Dispatch Shipment", description = "Ship to customer and deduct inventory (Smart Management)")
    public ResponseEntity<String> dispatch(@PathVariable("shipmentId") String shipmentId) {
        service.dispatch(shipmentId);
        return ResponseEntity.ok("Dispatched & Inventory Updated");
    }
}