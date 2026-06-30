package com.financeflow.goals.model.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public record GoalContribution(
    UUID id,
    UUID goalId,
    UUID userId,
    BigDecimal amount,
    String note,
    LocalDate contributionDate,
    Instant createdAt
) {
    public GoalContribution {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(goalId, "GoalId cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(amount, "Amount cannot be null");
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        Objects.requireNonNull(contributionDate, "Contribution date cannot be null");

        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
