package com.Lusficer.DisputeService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "DISPUTE_EVIDENCE")
@Data
@Schema(description = "Evidence attached to a dispute")
public class DisputeEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Evidence ID", example = "1")
    @JsonProperty("evidenceId")
    private Long evidenceId;

    @Column(nullable = false)
    @Schema(description = "Associated dispute ID")
    @JsonProperty("disputeId")
    private String disputeId;

    @Column(nullable = false)
    @Schema(description = "ID of the uploader (Vendor or Manager)")
    @JsonProperty("uploaderId")
    private String uploaderId;

    @Column(nullable = false, length = 500)
    @Schema(description = "File URL of the evidence", example = "https://cloud.storage/evidence/broken-vase.jpg")
    @JsonProperty("fileUrl")
    private String fileUrl;

    @Schema(description = "File type", example = "IMAGE")
    @JsonProperty("fileType")
    private String fileType;

    @Column(columnDefinition = "TEXT")
    @Schema(description = "Description of the evidence")
    @JsonProperty("description")
    private String description;

    @Column(updatable = false)
    @Schema(description = "Date when evidence was uploaded")
    @JsonProperty("uploadedAt")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }
}