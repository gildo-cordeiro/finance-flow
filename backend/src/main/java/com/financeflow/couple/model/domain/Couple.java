package com.financeflow.couple.model.domain;

import java.time.Instant;
import java.util.UUID;

public record Couple(
    UUID id,
    UUID user1Id,
    UUID user2Id,
    CoupleStatus status,
    String inviteToken,
    Instant inviteExpiresAt,
    Instant createdAt,
    Instant updatedAt
) {}
