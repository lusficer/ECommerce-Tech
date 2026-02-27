package com.Lusficer.UserService.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "DEACTIVATION_REQUEST", schema = "eCommerce_user_service")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeactivationRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "requestId")
    private Long requestId;
    
    @Column(name = "userId")
    private String userId;
    
    @Column(name = "reason")
    private String reason;
    
    @Column(name = "status")
    private String status; // PENDING, APPROVED, REJECTED
    
    @Column(name = "requestDate")
    private LocalDateTime requestDate;
    
    @Column(name = "approverId")
    private String approverId; // Admin who approves/rejects
    
    @Column(name = "approvalDate")
    private LocalDateTime approvalDate;
    
    @Column(name = "approvalReason")
    private String approvalReason; // Admin's reason for approval/rejection
}
