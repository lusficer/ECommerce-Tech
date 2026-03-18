package com.Lusficer.OrderService.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import com.Lusficer.OrderService.enums.ShippingStatus;
@Entity
@Table(name = "SHIPPING")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long shippingId;

    // Liên kết 1-1 với Order (Một đơn hàng có 1 chuyến đi giao)
    @Column(nullable = false, unique = true)
    private String orderId;

    // Mã của Shipper (người giao hàng), ví dụ: SHIPPER_001
    @Column(nullable = false)
    private String shipperId;

    // Trạng thái vận chuyển chi tiết
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShippingStatus status;

    // Ghi chú thêm của Shipper (VD: "Khách hẹn chiều giao", "Không gọi được")
    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}