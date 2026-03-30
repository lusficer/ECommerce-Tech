package com.Lusficer.DisputeService.service;

import com.Lusficer.DisputeService.dto.*;
import com.Lusficer.DisputeService.entity.*;
import com.Lusficer.DisputeService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DisputeService {

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private DisputeEvidenceRepository evidenceRepository;

    @Autowired
    private DisputeActionLogRepository logRepository;

    /**
     * Creates a new dispute for a specific order.
     * Customer initiates a dispute with reason and optional evidence.
     */
    @Transactional
    public Dispute createDispute(String userId, String shopId, CreateDisputeRequest request) {

        Dispute dispute = new Dispute();
        String shortUuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        dispute.setDisputeId("DISP-" + shortUuid);
        dispute.setUserId(userId);
        dispute.setShopId(shopId);
        dispute.setOrderId(request.getOrderId());
        dispute.setReason(DisputeReason.valueOf(request.getReason()));
        dispute.setDescription(request.getDescription());
        dispute.setStatus(DisputeStatus.PENDING);
        
        Dispute savedDispute = disputeRepository.save(dispute);

        if (request.getInitialEvidence() != null) {
            for (EvidenceDTO e : request.getInitialEvidence()) {
                addEvidence(savedDispute.getDisputeId(), userId, e);
            }
        }
        
        logAction(savedDispute.getDisputeId(), userId, "CREATE", "Dispute created");
        return savedDispute;
    }

    /**
     * Adds evidence or response to an existing dispute.
     * Automatically transitions status from WAITING_FOR_INFO to UNDER_REVIEW.
     */
    @Transactional
    public void addEvidence(String disputeId, String uploaderId, EvidenceDTO evidenceDTO) {
        DisputeEvidence evidence = new DisputeEvidence();
        evidence.setDisputeId(disputeId);
        evidence.setUploaderId(uploaderId);
        evidence.setFileUrl(evidenceDTO.getFileUrl());
        evidence.setFileType(evidenceDTO.getFileType());
        evidence.setDescription(evidenceDTO.getDescription());
        
        evidenceRepository.save(evidence);

        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow();
        if (dispute.getStatus() == DisputeStatus.WAITING_FOR_INFO) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
            disputeRepository.save(dispute);
        }
        
        logAction(disputeId, uploaderId, "PROVIDE_INFO", "Added new evidence: " + evidenceDTO.getFileType());
    }

    /**
     * Retrieves dispute details with all evidence.
     * Auto-transitions from PENDING to UNDER_REVIEW on first view.
     */
    public Dispute getDisputeDetails(String disputeId) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));
        
        List<DisputeEvidence> evidenceList = evidenceRepository.findByDisputeId(disputeId);
        dispute.setEvidenceList(evidenceList);
        
        if (dispute.getStatus() == DisputeStatus.PENDING) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
            disputeRepository.save(dispute);
        }
        return dispute;
    }

    /**
     * Requests additional information from customer or vendor.
     * Changes dispute status to WAITING_FOR_INFO.
     */
    @Transactional
    public void requestAdditionalInfo(String disputeId, String managerId, String requestMessage) {
        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow();
        
        dispute.setStatus(DisputeStatus.WAITING_FOR_INFO);
        disputeRepository.save(dispute);

        logAction(disputeId, managerId, "REQUEST_INFO", requestMessage);
    }

    /**
     * Resolves a dispute with approval or rejection.
     * For approved disputes, sets refund amount.
     */
    @Transactional
    public void resolveDispute(String disputeId, ResolveDisputeRequest request) {
        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow();

        if ("APPROVED".equalsIgnoreCase(request.getResolutionType())) {
            dispute.setStatus(DisputeStatus.RESOLVED_APPROVED);
            dispute.setRefundAmount(request.getRefundAmount());
        } else {
            dispute.setStatus(DisputeStatus.RESOLVED_REJECTED);
        }

        dispute.setResolutionSummary(request.getResolutionSummary());
        dispute.setResolvedBy(request.getManagerId());
        dispute.setResolvedAt(LocalDateTime.now());

        disputeRepository.save(dispute);
        logAction(disputeId, request.getManagerId(), "RESOLVE", "Dispute resolved as " + request.getResolutionType());
    }

    /**
     * Lists all disputes created by a user.
     */
    public List<Dispute> getDisputesByUser(String userId) {
        return disputeRepository.findByUserId(userId);
    }

    /**
     * Lists all disputes belonging to a specific shop.
     */
    public List<Dispute> getDisputesByShop(String shopId) {
        return disputeRepository.findByShopId(shopId);
    }

    /**
     * Records a dispute action in the audit log.
     */
    private void logAction(String disputeId, String actorId, String action, String message) {
        DisputeActionLog log = new DisputeActionLog();
        log.setDisputeId(disputeId);
        log.setActorId(actorId);
        log.setAction(action);
        log.setMessage(message);
        logRepository.save(log);
    }
}