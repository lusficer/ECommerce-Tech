package com.Lusficer.FulfillmentService.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "SHIPMENT_ITEM")
@Data
public class ShipmentItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne
    @JoinColumn(name = "shipmentId")
    @JsonIgnore
    private Shipment shipment;

    private String productId;
    private String productName; // Snapshot tên sản phẩm lúc mua
    private int quantity;

    private boolean isVerified; // Kết quả kiểm hàng tại kho
    @Column(name = "verificationNote") // Ánh xạ vào cột 'verificationNote' trong DB
    private String note;
}