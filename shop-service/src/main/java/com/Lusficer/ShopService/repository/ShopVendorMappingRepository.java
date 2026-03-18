package com.Lusficer.ShopService.repository;

import com.Lusficer.ShopService.entity.ShopVendorMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopVendorMappingRepository extends JpaRepository<ShopVendorMapping, Long> {
    
    List<ShopVendorMapping> findByVendorIdAndStatus(String vendorId, String status);
    
    List<ShopVendorMapping> findByShopIdAndStatus(String shopId, String status);
    
    boolean existsByShopIdAndVendorIdAndStatus(String shopId, String vendorId, String status);
    
    Optional<ShopVendorMapping> findByShopIdAndVendorId(String shopId, String vendorId);
}