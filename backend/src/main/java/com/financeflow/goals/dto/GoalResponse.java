package com.financeflow.goals.dto;

import com.financeflow.goals.model.domain.GoalStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponse(
    UUID id,
    UUID userId,
    UUID coupleId,
    String name,
    String description,
    BigDecimal targetAmount,
    BigDecimal currentAmount,
    LocalDate deadline,
    GoalStatus status,
    Instant createdAt,
    Instant updatedAt
) {}
