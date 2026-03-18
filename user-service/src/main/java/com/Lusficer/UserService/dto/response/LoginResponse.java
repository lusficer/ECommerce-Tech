package com.Lusficer.UserService.dto.response;

public record LoginResponse(
        String accessToken,
        String userId
) {}