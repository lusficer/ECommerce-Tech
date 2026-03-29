package com.Lusficer.DisputeService.repository;

import com.Lusficer.DisputeService.entity.Dispute;
import com.Lusficer.DisputeService.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {

    // Tìm tất cả tranh chấp của một User (UC: View Dispute Status)
    List<Dispute> findByUserId(String userId);

    // Tìm tranh chấp theo mã đơn hàng (Để kiểm tra xem đơn hàng này đã có tranh chấp chưa)
    Optional<Dispute> findByOrderId(String orderId);

    // Tìm tranh chấp theo trạng thái (Dùng cho Shop Manager lọc danh sách)
    List<Dispute> findByStatus(DisputeStatus status);

    // Tìm tranh chấp theo trạng thái và sắp xếp theo ngày tạo (Mới nhất lên đầu)
    List<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status);

    List<Dispute> findByShopId(String shopId);

}