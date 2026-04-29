package com.Lusficer.OrderService.repository;

import com.Lusficer.OrderService.entity.ShippingPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShippingPhotoRepository extends JpaRepository<ShippingPhoto, Long> {
    List<ShippingPhoto> findByShippingId(Long shippingId);
    List<ShippingPhoto> findByShippingIdAndPhotoType(Long shippingId, 
            com.Lusficer.OrderService.enums.ShippingStatus photoType);
}