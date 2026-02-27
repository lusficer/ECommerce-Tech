// shop-service/src/main/java/com/Lusficer/ShopService/dto/DeactivateShopRequest.java
package com.Lusficer.ShopService.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

public record DeactivateShopRequest(
        boolean confirm,

        @NotBlank(message = "Reason is required")
        String reason
) {

    @AssertTrue(message = "Must confirm shop deactivation")
    public boolean isConfirm() {
        return confirm;
    }
}