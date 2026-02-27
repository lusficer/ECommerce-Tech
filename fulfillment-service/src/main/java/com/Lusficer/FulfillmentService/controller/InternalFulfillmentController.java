package com.Lusficer.FulfillmentService.controller;

import com.Lusficer.FulfillmentService.dto.CreateShipmentRequest;
import com.Lusficer.FulfillmentService.entity.Shipment;
import com.Lusficer.FulfillmentService.service.FulfillmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/fulfillment")
@Tag(name = "Internal Fulfillment API", description = "APIs for system integration (Order Service -> Fulfillment)")
public class InternalFulfillmentController {

    @Autowired
    private FulfillmentService service;

    @PostMapping("/create")
    @Operation(summary = "Create Shipment", description = "System call to create a new shipment after order placement")
    public ResponseEntity<Shipment> createShipment(@RequestBody CreateShipmentRequest req) {
        return ResponseEntity.ok(service.createShipment(req));
    }
}