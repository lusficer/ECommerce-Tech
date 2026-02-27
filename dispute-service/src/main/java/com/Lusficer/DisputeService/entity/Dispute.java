package com.Lusficer.DisputeService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Entity
@Table(name = "DISPUTE")
@Data
@Schema(description = "Dispute entity representing a customer dispute")
public class Dispute {
    @Id
    @Schema(description = "Unique dispute identifier", example = "DISP_NEW_01")
    private String disputeId;
    
    @Schema(description = "Order ID associated with the dispute", example = "ORD_VIRTUAL_001")
    private String orderId;
    
    @Schema(description = "Vendor ID", example = "VEND_001")
    private String vendorId;
    
    @Schema(description = "Shop ID", example = "SHOP_001")
    private String shopId;

    @Enumerated(EnumType.STRING)
    @Schema(description = "Reason for dispute")
    private DisputeReason reason;

    @Schema(description = "Dispute description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Schema(description = "Current status of the dispute")
    private DisputeStatus status;

    @Schema(description = "Resolution summary")
    private String resolutionSummary;
    
    @Schema(description = "Refund amount")
    private BigDecimal refundAmount;
    
    @Schema(description = "Date when dispute was resolved")
    private LocalDateTime resolvedAt;
    
    @Schema(description = "ID of user who resolved the dispute")
    private String resolvedBy;

    @Schema(description = "Date when dispute was created")
    private LocalDateTime createdAt;
    
    @Schema(description = "Date when dispute was last updated")
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "disputeId", referencedColumnName = "disputeId")
    @Schema(description = "List of evidence for this dispute")
    private List<DisputeEvidence> evidenceList;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}