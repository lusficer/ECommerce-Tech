package com.Lusficer.FulfillmentService.repository;

import com.Lusficer.FulfillmentService.entity.Shipment;
import com.Lusficer.FulfillmentService.entity.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    List<Shipment> findByStatus(ShipmentStatus status);
    List<Shipment> findByVendorId(String vendorId);
}