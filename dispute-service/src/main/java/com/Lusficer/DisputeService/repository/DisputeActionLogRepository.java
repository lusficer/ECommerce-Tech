package com.Lusficer.DisputeService.repository;

import com.Lusficer.DisputeService.entity.DisputeActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeActionLogRepository extends JpaRepository<DisputeActionLog, Long> {

    /**
     * Returns the dispute action history ordered by time ascending.
     */
    List<DisputeActionLog> findByDisputeIdOrderByCreatedAtAsc(String disputeId);
}