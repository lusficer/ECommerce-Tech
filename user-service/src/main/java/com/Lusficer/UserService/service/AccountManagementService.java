package com.Lusficer.UserService.service;

import com.Lusficer.UserService.dto.AccountStatusDTO;
import com.Lusficer.UserService.dto.request.DeactivateAccountRequest;
import com.Lusficer.UserService.dto.request.DeactivationRequestDTO;
import com.Lusficer.UserService.dto.response.DeactivateAccountResponse;
import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.entity.UserRole.RoleName;
import com.Lusficer.UserService.entity.UserPayment;
import com.Lusficer.UserService.entity.UserStatus;
import com.Lusficer.UserService.entity.DeactivationRequest;
import com.Lusficer.UserService.repository.UserProfileRepository;
import com.Lusficer.UserService.repository.UserRoleRepository;
import com.Lusficer.UserService.repository.UserPaymentRepository;
import com.Lusficer.UserService.repository.UserStatusRepository;
import com.Lusficer.UserService.repository.DeactivationRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Provides account management operations for profiles, roles, and deactivation.
 */
@Service
public class AccountManagementService {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserPaymentRepository userPaymentRepository;

    @Autowired
    private UserStatusRepository userStatusRepository;

    @Autowired
    private DeactivationRequestRepository deactivationRequestRepository;

    /**
     * Retrieve the user's profile and status.
     * @param userId the user identifier to lookup
     * @return Optional containing AccountStatusDTO with both profile and status if present
     */
    public Optional<AccountStatusDTO> viewAccountStatus(String userId) {
        Optional<UserProfile> profile = userProfileRepository.findById(userId);
        Optional<UserStatus> status = userStatusRepository.findById(userId);
        
        if (profile.isPresent() && status.isPresent()) {
            return Optional.of(AccountStatusDTO.builder()
                    .profile(profile.get())
                    .status(status.get())
                    .build());
        }
        return Optional.empty();
    }

    /**
     * Update the user's profile information.
     */
    public UserProfile updateAccountDetails(String userId, UserProfile details) {
        details.setUserId(userId);
        return userProfileRepository.save(details);
    }

    /**
     * Assign or update a user's role.
     * - If the user already has a role, update the roleName and timestamp.
     * - If no role exists, create a new UserRole with an auto-generated roleId
     *   using a short prefix and 3-digit sequence (e.g. "V-001").
     */
    public UserRole manageAccountRole(String userId, String roleName) {
        if (!userProfileRepository.existsById(userId)) {
            throw new IllegalArgumentException("User ID " + userId + " does not exist in USER_PROFILE");
        }

        RoleName parsedRole;
        try {
            parsedRole = RoleName.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role name: " + roleName);
        }

        Optional<UserRole> existingRole = userRoleRepository.findByUserId(userId);

        UserRole role;
        if (existingRole.isPresent()) {
            role = existingRole.get();
            role.setRoleName(parsedRole);
            role.setCreatedAt(LocalDateTime.now());
        } else {
            String prefix = switch (parsedRole) {
                case ADMIN -> "AD";
                case CUSTOMER -> "C";
                case SHOP_MANAGER -> "S";
                case VENDOR -> "V";
                case GUEST -> "G";
                case WAREHOUSE_MANAGER -> "WM";
                case SHIPPER ->  "SH"; 
            };

            long count = userRoleRepository.count() + 1;
            String generatedRoleId = prefix + String.format("-%03d", count);

            role = new UserRole();
            role.setRoleId(generatedRoleId);
            role.setUserId(userId);
            role.setRoleName(parsedRole);
            role.setCreatedAt(LocalDateTime.now());
        }

        return userRoleRepository.save(role);
    }


    /**
     * Update payment information for the user.
     */
    public UserPayment updatePaymentInfo(String userId, UserPayment paymentDetails) {
        paymentDetails.setUserId(userId);
        return userPaymentRepository.save(paymentDetails);
    }

    /**
     * Retrieve the list of all users.
     */
    public List<UserProfile> getAllUsers() {
        return userProfileRepository.findAll();
    }

    /**
     * Request account deactivation. Creates a PENDING deactivation request.
     * User must provide a reason. Request goes to admin for approval.
     */
    public DeactivateAccountResponse requestDeactivation(String userId, DeactivateAccountRequest request) {
        if (!userProfileRepository.existsById(userId)) {
            throw new IllegalArgumentException("User ID " + userId + " does not exist");
        }
        
        Optional<DeactivationRequest> existingRequest = deactivationRequestRepository
                .findByUserIdAndStatus(userId, "PENDING");
        if (existingRequest.isPresent()) {
            throw new IllegalArgumentException("User already has a pending deactivation request");
        }
        
        DeactivationRequest deactivationRequest = DeactivationRequest.builder()
                .userId(userId)
                .reason(request.reason())
                .status("PENDING")
                .requestDate(LocalDateTime.now())
                .build();
        
        DeactivationRequest saved = deactivationRequestRepository.save(deactivationRequest);
        
        return DeactivateAccountResponse.builder()
                .requestId(saved.getRequestId())
                .userId(saved.getUserId())
                .status(saved.getStatus())
                .requestDate(saved.getRequestDate())
                .message("Deactivation request submitted. Waiting for admin approval.")
                .build();
    }
    
    /**
     * Get all pending deactivation requests (Admin only).
     */
    public List<DeactivationRequestDTO> getPendingRequests() {
        return deactivationRequestRepository.findByStatus("PENDING")
                .stream()
                .map(req -> DeactivationRequestDTO.builder()
                        .requestId(req.getRequestId())
                        .userId(req.getUserId())
                        .reason(req.getReason())
                        .status(req.getStatus())
                        .requestDate(req.getRequestDate())
                        .approverId(req.getApproverId())
                        .approvalDate(req.getApprovalDate())
                        .approvalReason(req.getApprovalReason())
                        .build())
                .toList();
    }
    
    /**
     * Approve deactivation request and delete user account (Admin only).
     */
    public DeactivateAccountResponse approveDeactivation(Long requestId, String adminId, 
                                                         String approvalReason) {
        DeactivationRequest request = deactivationRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Deactivation request not found"));
        
        if (!request.getStatus().equals("PENDING")) {
            throw new IllegalArgumentException("Request is not in PENDING status");
        }
        
        String userId = request.getUserId();
        
        request.setStatus("APPROVED");
        request.setApproverId(adminId);
        request.setApprovalDate(LocalDateTime.now());
        request.setApprovalReason(approvalReason);
        deactivationRequestRepository.save(request);
        
        userProfileRepository.deleteById(userId);
        userStatusRepository.deleteById(userId);
        userRoleRepository.deleteByUserId(userId);
        userPaymentRepository.deleteByUserId(userId);
        
        return DeactivateAccountResponse.builder()
                .requestId(request.getRequestId())
                .userId(userId)
                .status("APPROVED")
                .requestDate(request.getRequestDate())
                .message("Account successfully deactivated and deleted.")
                .build();
    }
    
    /**
     * Reject deactivation request (Admin only).
     */
    public DeactivateAccountResponse rejectDeactivation(Long requestId, String adminId, 
                                                        String rejectionReason) {
        DeactivationRequest request = deactivationRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Deactivation request not found"));
        
        if (!request.getStatus().equals("PENDING")) {
            throw new IllegalArgumentException("Request is not in PENDING status");
        }
        
        request.setStatus("REJECTED");
        request.setApproverId(adminId);
        request.setApprovalDate(LocalDateTime.now());
        request.setApprovalReason(rejectionReason);
        deactivationRequestRepository.save(request);
        
        return DeactivateAccountResponse.builder()
                .requestId(request.getRequestId())
                .userId(request.getUserId())
                .status("REJECTED")
                .requestDate(request.getRequestDate())
                .message("Deactivation request has been rejected.")
                .build();
    }
}