package com.Lusficer.DisputeService.repository;

import com.Lusficer.DisputeService.entity.DisputeEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeEvidenceRepository extends JpaRepository<DisputeEvidence, Long> {

    // Lấy danh sách bằng chứng của một vụ tranh chấp cụ thể
    List<DisputeEvidence> findByDisputeId(String disputeId);
}