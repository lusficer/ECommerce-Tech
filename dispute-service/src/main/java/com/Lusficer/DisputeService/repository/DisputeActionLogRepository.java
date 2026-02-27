package com.Lusficer.DisputeService.repository;

import com.Lusficer.DisputeService.entity.DisputeActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeActionLogRepository extends JpaRepository<DisputeActionLog, Long> {

    // Lấy lịch sử xử lý của một vụ tranh chấp, sắp xếp theo thời gian tăng dần (Cũ -> Mới)
    // Để hiển thị timeline cho Vendor/Manager xem
    List<DisputeActionLog> findByDisputeIdOrderByCreatedAtAsc(String disputeId);
}