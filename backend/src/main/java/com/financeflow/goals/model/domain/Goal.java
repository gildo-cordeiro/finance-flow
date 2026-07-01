package com.financeflow.goals.model.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public record Goal(
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
) {
    public Goal {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(name, "Name cannot be null");
        if (name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        Objects.requireNonNull(targetAmount, "Target amount cannot be null");
        if (targetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Target amount must be greater than zero");
        }
        Objects.requireNonNull(deadline, "Deadline cannot be null");
        Objects.requireNonNull(status, "Status cannot be null");

        if (userId == null && coupleId == null) {
            throw new IllegalArgumentException("Goal must belong to either a user or a couple");
        }
        if (userId != null && coupleId != null) {
            throw new IllegalArgumentException("Goal cannot belong to both a user and a couple at the same time");
        }

        if (currentAmount == null) {
            currentAmount = BigDecimal.ZERO;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
