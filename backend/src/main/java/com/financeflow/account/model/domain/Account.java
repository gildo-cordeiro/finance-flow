package com.financeflow.account.model.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record Account(
    UUID id,
    UUID userId,
    String name,
    AccountType type,
    String bank,
    BigDecimal balance,
    BigDecimal creditLimit,
    Integer closingDay,
    Integer dueDay,
    UUID associatedAccountId,
    Instant createdAt,
    Instant updatedAt
) {
    public Account {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(name, "Name cannot be null");
        if (name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        Objects.requireNonNull(type, "Type cannot be null");
        Objects.requireNonNull(bank, "Bank cannot be null");
        if (bank.isBlank()) {
            throw new IllegalArgumentException("Bank cannot be blank");
        }
        Objects.requireNonNull(balance, "Balance cannot be null");

        if (type == AccountType.CREDIT_CARD) {
            Objects.requireNonNull(creditLimit, "Credit limit is required for credit cards");
            if (creditLimit.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Credit limit cannot be negative");
            }
            Objects.requireNonNull(closingDay, "Closing day is required for credit cards");
            if (closingDay < 1 || closingDay > 31) {
                throw new IllegalArgumentException("Closing day must be between 1 and 31");
            }
            Objects.requireNonNull(dueDay, "Due day is required for credit cards");
            if (dueDay < 1 || dueDay > 31) {
                throw new IllegalArgumentException("Due day must be between 1 and 31");
            }
        } else {
            if (creditLimit != null || closingDay != null || dueDay != null) {
                throw new IllegalArgumentException("Credit card fields must be null for non-credit card accounts");
            }
            if (associatedAccountId != null) {
                throw new IllegalArgumentException("Non-credit card accounts cannot have an associated account");
            }
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
