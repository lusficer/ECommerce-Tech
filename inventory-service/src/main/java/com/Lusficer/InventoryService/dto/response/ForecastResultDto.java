package com.Lusficer.InventoryService.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForecastResultDto {
    private String productId;
    
    // [NEW] Tên sản phẩm cho dễ đọc (Trong thực tế cần gọi ProductService lấy về, nhưng Demo ta có thể map tạm)
    private String productName; 

    private Double trendSlope;
    private Double predictedNextDay;
    
    // [NEW] Nhãn dán xu hướng (Ví dụ: "🔥 BÁN CHẠY")
    private String trendLabel; 
    
    // [NEW] Lời khuyên hành động (Ví dụ: "Cần nhập thêm 50 cái")
    private String aiRecommendation;

    private Integer oldSafetyStock;
    private Integer newSafetyStock;
    private String status;
}