package com.financeflow.transaction.model.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record Category(
    UUID id,
    UUID userId,
    String name,
    UUID parentId,
    TransactionVisibility visibility,
    Instant createdAt,
    Instant updatedAt
) {
    public Category {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(name, "Name cannot be null");
        if (name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        if (visibility == null) {
            visibility = TransactionVisibility.PERSONAL;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
