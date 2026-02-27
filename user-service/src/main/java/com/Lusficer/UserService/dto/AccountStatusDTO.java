package com.Lusficer.UserService.dto;

import com.Lusficer.UserService.entity.UserProfile;
import com.Lusficer.UserService.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountStatusDTO {
    private UserProfile profile;
    private UserStatus status;
}