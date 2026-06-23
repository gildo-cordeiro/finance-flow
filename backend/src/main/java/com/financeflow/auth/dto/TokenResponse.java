package com.financeflow.auth.dto;

public record TokenResponse(
    String accessToken,
    String refreshToken
) {}
