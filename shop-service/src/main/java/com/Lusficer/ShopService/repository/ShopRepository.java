package com.Lusficer.ShopService.repository;

import com.Lusficer.ShopService.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ShopRepository extends JpaRepository<Shop, String> {
    boolean existsByShopIdAndOwnerId(String shopId, String ownerId);
    java.util.List<Shop> findByOwnerId(String ownerId);
    List<Shop> findByShopNameContainingIgnoreCaseOrShopIdContainingIgnoreCase(String name, String id);
    Shop findByShopId(String shopId);
}