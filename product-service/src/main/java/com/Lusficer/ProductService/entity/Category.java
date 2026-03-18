package com.Lusficer.ProductService.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "CATEGORY")
@Data
public class Category {
    @Id
    private String categoryId;

    @Column(nullable = false)
    private String name;

    private String parentId;
    private String description;
    private String status;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}