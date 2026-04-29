package com.Lusficer.DisputeService.repository;

import com.Lusficer.DisputeService.entity.Dispute;
import com.Lusficer.DisputeService.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {

    /**
     * Returns all disputes created by the given user.
     */
    List<Dispute> findByUserId(String userId);

    /**
     * Returns whether the user has any dispute history.
     */
    boolean existsByUserId(String userId);

    /**
     * Finds a dispute by order id to check if a dispute already exists.
     */
    Optional<Dispute> findByOrderId(String orderId);

    /**
     * Returns disputes filtered by status.
     */
    List<Dispute> findByStatus(DisputeStatus status);

    /**
     * Returns disputes by status ordered by creation time descending.
     */
    List<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status);

    /**
     * Returns disputes for a specific shop.
     */
    List<Dispute> findByShopId(String shopId);

}