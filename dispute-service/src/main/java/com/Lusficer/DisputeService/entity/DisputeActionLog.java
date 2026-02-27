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
    private String actorId; // ID của người thực hiện hành động (Vendor hoặc Shop Manager)

    @Column(nullable = false)
    private String action; // Ví dụ: "CREATE", "REQUEST_INFO", "RESOLVE", "PROVIDE_INFO"

    @Column(columnDefinition = "TEXT")
    private String message; // Nội dung ghi chú hoặc tin nhắn kèm theo

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}