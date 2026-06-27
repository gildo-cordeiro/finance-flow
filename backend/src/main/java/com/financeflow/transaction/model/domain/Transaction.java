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
    UUID installmentGroupId,
    Integer installmentNumber,
    Integer totalInstallments,
    boolean isRecurring,
    String recurrenceRule,
    UUID recurrenceGroupId,
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

        if (installmentGroupId != null) {
            Objects.requireNonNull(installmentNumber, "Installment number cannot be null if installmentGroupId is set");
            Objects.requireNonNull(totalInstallments, "Total installments cannot be null if installmentGroupId is set");
            if (installmentNumber <= 0) {
                throw new IllegalArgumentException("Installment number must be greater than zero");
            }
            if (totalInstallments <= 0) {
                throw new IllegalArgumentException("Total installments must be greater than zero");
            }
            if (installmentNumber > totalInstallments) {
                throw new IllegalArgumentException("Installment number cannot exceed total installments");
            }
        }
        if (isRecurring) {
            Objects.requireNonNull(recurrenceRule, "Recurrence rule cannot be null if transaction is recurring");
            if (recurrenceRule.isBlank()) {
                throw new IllegalArgumentException("Recurrence rule cannot be blank if transaction is recurring");
            }
            Objects.requireNonNull(recurrenceGroupId, "Recurrence group ID cannot be null if transaction is recurring");
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
