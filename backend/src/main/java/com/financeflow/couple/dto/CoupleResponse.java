package com.financeflow.couple.dto;

public record CoupleResponse(
    String status,
    Boolean isSender,
    String partnerEmail,
    String partnerName,
    String inviteToken
) {}
