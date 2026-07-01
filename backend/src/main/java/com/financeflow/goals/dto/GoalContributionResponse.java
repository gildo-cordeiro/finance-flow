package com.financeflow.goals.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record GoalContributionResponse(
    UUID id,
    UUID goalId,
    UUID userId,
    BigDecimal amount,
    String note,
    LocalDate contributionDate,
    String type,
    Instant createdAt
) {}
