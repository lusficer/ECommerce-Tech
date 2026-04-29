package com.Lusficer.ShopService.dto;

import lombok.Builder;

@Builder
public record WarehouseInfoDTO(
        String warehouseAddress,
        String warehouseCity,
        String warehouseDistrict,
        String warehouseWard,
        String warehousePhone
) {}
