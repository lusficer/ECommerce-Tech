// shop-service/src/main/java/com/Lusficer/ShopService/repository/ShopRepository.java
package com.Lusficer.ShopService.repository;

import com.Lusficer.ShopService.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopRepository extends JpaRepository<Shop, String> {
    boolean existsByShopIdAndOwnerId(String shopId, String ownerId);
    java.util.List<Shop> findByOwnerId(String ownerId);
}