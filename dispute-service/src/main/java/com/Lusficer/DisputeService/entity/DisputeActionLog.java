package com.Lusficer.DisputeService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "DISPUTE_ACTION_LOG")
@Data
public class DisputeActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    @Column(nullable = false)
    private String disputeId;

    @Column(nullable = false)
    private String actorId; // ID of the actor (vendor or shop manager)

    @Column(nullable = false)
    private String action; // Example: "CREATE", "REQUEST_INFO", "RESOLVE", "PROVIDE_INFO"

    @Column(columnDefinition = "TEXT")
    private String message; // Notes or message associated with the action

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Sets the creation timestamp before persisting.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}