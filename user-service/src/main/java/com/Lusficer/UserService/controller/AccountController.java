package com.Lusficer.UserService.controller;

import com.Lusficer.UserService.dto.AccountStatusDTO;
import com.Lusficer.UserService.dto.request.DeactivateAccountRequest;
import com.Lusficer.UserService.dto.request.DeactivationRequestDTO;
import com.Lusficer.UserService.dto.response.DeactivateAccountResponse;
import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserRole;
import com.Lusficer.UserService.entity.UserPayment;
import com.Lusficer.UserService.service.AccountManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@SecurityRequirement(name = "Bearer Token")
@Tag(name = "Account", description = "Manage account")
public class AccountController {

    @Autowired
    private AccountManagementService accountService;

    @GetMapping("/status/{userId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "View account status",
        description = "Returns the account profile and status for a given userId. Requires authentication.",
        security = { @SecurityRequirement(name = "Bearer Token") }
    )
    @ApiResponse(
        responseCode = "200",
        description = "Successful operation",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.AccountStatusDTO.class))
    )
    @ApiResponse(
        responseCode = "401",
        description = "Unauthorized - No valid token provided",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "User not found",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<AccountStatusDTO> viewAccountStatus(
            @PathVariable("userId") String userId) {
        return accountService.viewAccountStatus(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/details/{userId}")
    @Operation(summary = "Update account details", description = "Updates the account details for a given userId")
    @ApiResponse(
        responseCode = "200",
        description = "Profile updated",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.entity.UserProfile.class))
    )
    @ApiResponse(
        responseCode = "401",
        description = "Unauthorized - No valid token provided",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "User not found",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<UserProfile> updateAccountDetails(
            @PathVariable("userId") String userId,
            @RequestBody UserProfile details) {
        return ResponseEntity.ok(accountService.updateAccountDetails(userId, details));
    }

    @PostMapping("/role/{userId}")
    @Operation(summary = "Manage account role", description = "Assigns or updates a role for a given userId")
    @ApiResponse(
        responseCode = "200",
        description = "Role assigned/updated",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.entity.UserRole.class))
    )
    @ApiResponse(
        responseCode = "401",
        description = "Unauthorized - No valid token provided",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "User not found",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<UserRole> manageAccountRole(
            @PathVariable("userId") String userId,
            @RequestParam("role") String role) {
        return ResponseEntity.ok(accountService.manageAccountRole(userId, role));
    }

    @PutMapping("/payment/{userId}")
    @Operation(summary = "Update payment info", description = "Updates the payment information for a given userId")
    @ApiResponse(
        responseCode = "200",
        description = "Payment info updated",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.entity.UserPayment.class))
    )
    @ApiResponse(
        responseCode = "401",
        description = "Unauthorized - No valid token provided",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "User not found",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<UserPayment> updatePaymentInfo(
            @PathVariable("userId") String userId,
            @RequestBody UserPayment paymentDetails) {
        return ResponseEntity.ok(accountService.updatePaymentInfo(userId, paymentDetails));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users", description = "Returns list of all registered users")
    @ApiResponse(
        responseCode = "200",
        description = "List of users",
        content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = com.Lusficer.UserService.entity.UserProfile.class)))
    )
    @ApiResponse(
        responseCode = "401",
        description = "Unauthorized - No valid token provided",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<List<UserProfile>> getAllUsers() {
        return ResponseEntity.ok(accountService.getAllUsers());
    }

    @PostMapping("/deactivate/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Request account deactivation", description = "User requests account deactivation. Goes to admin for approval.")
    @ApiResponse(
        responseCode = "200",
        description = "Deactivation request created",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeactivateAccountResponse.class))
    )
    @ApiResponse(
        responseCode = "400",
        description = "Bad request - User not found or pending request exists",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<DeactivateAccountResponse> requestDeactivation(
            @PathVariable("userId") String userId,
            @RequestBody @Valid DeactivateAccountRequest request) {
        return ResponseEntity.ok(accountService.requestDeactivation(userId, request));
    }

    @PostMapping("/deactivate/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Request account deactivation (self)", description = "Authenticated user requests their own account deactivation. Goes to admin for approval.")
    @ApiResponse(
        responseCode = "200",
        description = "Deactivation request created",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeactivateAccountResponse.class))
    )
    public ResponseEntity<DeactivateAccountResponse> requestDeactivationForSelf(
            Authentication authentication,
            @RequestBody @Valid DeactivateAccountRequest request) {
        String currentUserId = authentication.getName();
        return ResponseEntity.ok(accountService.requestDeactivation(currentUserId, request));
    }

    @GetMapping("/deactivate/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get pending deactivation requests", description = "Returns list of pending account deactivation requests. Admin only.")
    @ApiResponse(
        responseCode = "200",
        description = "List of pending requests",
        content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = DeactivationRequestDTO.class)))
    )
    @ApiResponse(
        responseCode = "403",
        description = "Forbidden - User does not have ADMIN role",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<List<DeactivationRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(accountService.getPendingRequests());
    }

    @PutMapping("/deactivate/approve/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve deactivation request", description = "Admin approves deactivation request and deletes account. Admin only.")
    @ApiResponse(
        responseCode = "200",
        description = "Request approved and account deleted",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeactivateAccountResponse.class))
    )
    @ApiResponse(
        responseCode = "403",
        description = "Forbidden - User does not have ADMIN role",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "Request not found or not in PENDING status",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<DeactivateAccountResponse> approveDeactivation(
            @PathVariable("requestId") Long requestId,
            @RequestParam("adminId") String adminId,
            @RequestParam(name = "reason", required = false, defaultValue = "Approved") String reason) {
        return ResponseEntity.ok(accountService.approveDeactivation(requestId, adminId, reason));
    }

    @PutMapping("/deactivate/reject/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject deactivation request", description = "Admin rejects deactivation request. Account remains active. Admin only.")
    @ApiResponse(
        responseCode = "200",
        description = "Request rejected",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeactivateAccountResponse.class))
    )
    @ApiResponse(
        responseCode = "403",
        description = "Forbidden - User does not have ADMIN role",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    @ApiResponse(
        responseCode = "404",
        description = "Request not found or not in PENDING status",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = com.Lusficer.UserService.dto.ApiError.class))
    )
    public ResponseEntity<DeactivateAccountResponse> rejectDeactivation(
            @PathVariable("requestId") Long requestId,
            @RequestParam("adminId") String adminId,
            @RequestParam(name = "reason", required = false, defaultValue = "Rejected") String reason) {
        return ResponseEntity.ok(accountService.rejectDeactivation(requestId, adminId, reason));
    }
}
