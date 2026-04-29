package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.ShipperStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipperStatusRepository extends JpaRepository<ShipperStatus, String> {
    List<ShipperStatus> findByStatus(String status);
}