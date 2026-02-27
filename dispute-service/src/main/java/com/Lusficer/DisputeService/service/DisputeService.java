package com.Lusficer.DisputeService.service;

import com.Lusficer.DisputeService.dto.*;
import com.Lusficer.DisputeService.entity.*;
import com.Lusficer.DisputeService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class DisputeService {

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private DisputeEvidenceRepository evidenceRepository;

    @Autowired
    private DisputeActionLogRepository logRepository;

    // --- VENDOR USE CASES ---

    // UC: Submit Order Dispute
    @Transactional
    public Dispute createDispute(String vendorId, CreateDisputeRequest request) {
        // TODO: Validate OrderId exists via OrderService FeignClient

        Dispute dispute = new Dispute();
        dispute.setDisputeId(UUID.randomUUID().toString());
        dispute.setVendorId(vendorId);
        dispute.setOrderId(request.getOrderId());
        dispute.setReason(DisputeReason.valueOf(request.getReason()));
        dispute.setDescription(request.getDescription());
        dispute.setStatus(DisputeStatus.PENDING);
        
        Dispute savedDispute = disputeRepository.save(dispute);

        // Lưu bằng chứng ban đầu
        if (request.getInitialEvidence() != null) {
            for (EvidenceDTO e : request.getInitialEvidence()) {
                addEvidence(savedDispute.getDisputeId(), vendorId, e);
            }
        }
        
        logAction(savedDispute.getDisputeId(), vendorId, "CREATE", "Dispute created");
        return savedDispute;
    }

    // UC: Provide Evidence/Response
    @Transactional
    public void addEvidence(String disputeId, String uploaderId, EvidenceDTO evidenceDTO) {
        DisputeEvidence evidence = new DisputeEvidence();
        evidence.setDisputeId(disputeId);
        evidence.setUploaderId(uploaderId);
        evidence.setFileUrl(evidenceDTO.getFileUrl());
        evidence.setFileType(evidenceDTO.getFileType());
        evidence.setDescription(evidenceDTO.getDescription());
        
        evidenceRepository.save(evidence);

        // Nếu dispute đang đợi thông tin, chuyển lại trạng thái Under Review
        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow();
        if (dispute.getStatus() == DisputeStatus.WAITING_FOR_INFO) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
            disputeRepository.save(dispute);
        }
        
        logAction(disputeId, uploaderId, "PROVIDE_INFO", "Added new evidence: " + evidenceDTO.getFileType());
    }

    // --- SHOP MANAGER USE CASES ---

    // UC: Review Order Dispute (Get Details)
    public Dispute getDisputeDetails(String disputeId) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));
        
        // Khi Manager xem lần đầu, chuyển sang UNDER_REVIEW
        if (dispute.getStatus() == DisputeStatus.PENDING) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
            disputeRepository.save(dispute);
        }
        return dispute;
    }

    // UC: Request Additional Information
    @Transactional
    public void requestAdditionalInfo(String disputeId, String managerId, String requestMessage) {
        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow();
        
        dispute.setStatus(DisputeStatus.WAITING_FOR_INFO);
        disputeRepository.save(dispute);

        logAction(disputeId, managerId, "REQUEST_INFO", requestMessage);
        
        // TODO: Gửi email/notification cho Vendor
    }

    // UC: Resolve Dispute & Record Resolution Details
    @Transactional
    public void resolveDispute(String disputeId, ResolveDisputeRequest request) {
        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow();

        if ("APPROVED".equalsIgnoreCase(request.getResolutionType())) {
            dispute.setStatus(DisputeStatus.RESOLVED_APPROVED);
            dispute.setRefundAmount(request.getRefundAmount());
            // TODO: Call Payment Service to process Refund
        } else {
            dispute.setStatus(DisputeStatus.RESOLVED_REJECTED);
        }

        dispute.setResolutionSummary(request.getResolutionSummary());
        dispute.setResolvedBy(request.getManagerId());
        dispute.setResolvedAt(LocalDateTime.now());

        disputeRepository.save(dispute);
        logAction(disputeId, request.getManagerId(), "RESOLVE", "Dispute resolved as " + request.getResolutionType());
    }

    private void logAction(String disputeId, String actorId, String action, String message) {
        DisputeActionLog log = new DisputeActionLog();
        log.setDisputeId(disputeId);
        log.setActorId(actorId);
        log.setAction(action);
        log.setMessage(message);
        logRepository.save(log);
    }
}