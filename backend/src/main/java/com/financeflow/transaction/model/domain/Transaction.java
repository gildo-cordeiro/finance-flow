package com.financeflow.transaction.model.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public record Transaction(
    UUID id,
    UUID userId,
    UUID accountId,
    UUID categoryId,
    String description,
    BigDecimal amount,
    TransactionType type,
    LocalDate competenceDate,
    LocalDate dueDate,
    LocalDate paymentDate,
    TransactionStatus status,
    TransactionVisibility visibility,
    Instant createdAt,
    Instant updatedAt
) {
    public Transaction {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(accountId, "AccountId cannot be null");
        Objects.requireNonNull(categoryId, "CategoryId cannot be null");
        Objects.requireNonNull(description, "Description cannot be null");
        if (description.isBlank()) {
            throw new IllegalArgumentException("Description cannot be blank");
        }
        Objects.requireNonNull(amount, "Amount cannot be null");
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        Objects.requireNonNull(type, "Type cannot be null");
        Objects.requireNonNull(competenceDate, "Competence date cannot be null");
        Objects.requireNonNull(dueDate, "Due date cannot be null");
        Objects.requireNonNull(status, "Status cannot be null");
        Objects.requireNonNull(visibility, "Visibility cannot be null");

        if (status == TransactionStatus.PAID && paymentDate == null) {
            throw new IllegalArgumentException("Payment date is required when transaction status is PAID");
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
