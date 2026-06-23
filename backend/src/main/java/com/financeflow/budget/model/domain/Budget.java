package com.financeflow.budget.model.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record Budget(
    UUID id,
    UUID userId,
    UUID categoryId,
    String month,
    BigDecimal plannedAmount,
    Instant createdAt,
    Instant updatedAt
) {
    public Budget {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(categoryId, "CategoryId cannot be null");
        Objects.requireNonNull(month, "Month cannot be null");
        if (!month.matches("^\\d{4}-\\d{2}$")) {
            throw new IllegalArgumentException("Month must be in YYYY-MM format");
        }
        Objects.requireNonNull(plannedAmount, "Planned amount cannot be null");
        if (plannedAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Planned amount cannot be negative");
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
