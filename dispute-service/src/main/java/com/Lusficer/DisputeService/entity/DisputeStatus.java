package com.Lusficer.DisputeService.entity;
public enum DisputeStatus {
    PENDING,            // Newly created
    UNDER_REVIEW,       // Manager reviewing
    WAITING_FOR_INFO,   // Manager requested more information
    RESOLVED_APPROVED,  // Dispute approved
    RESOLVED_REJECTED   // Dispute rejected
}