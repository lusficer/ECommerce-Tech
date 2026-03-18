package com.Lusficer.UserService.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "WISHLIST", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"userId", "productId"}) 
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Wishlist {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "productId", nullable = false)
    private String productId;

    @CreationTimestamp
    @Column(name = "addedAt", updatable = false)
    private LocalDateTime addedAt;
}