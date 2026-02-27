package com.Lusficer.ProductService.repository;

import com.Lusficer.ProductService.entity.ProductApprovalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductApprovalLogRepository extends JpaRepository<ProductApprovalLog, Long> {
}
