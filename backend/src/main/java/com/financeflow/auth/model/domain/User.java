package com.financeflow.auth.model.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record User(
    UUID id,
    String email,
    String password,
    String name,
    String timeZone,
    String currency,
    int budgetClosingDay,
    Instant createdAt,
    Instant updatedAt
) {
    public User {
        Objects.requireNonNull(id, "Id cannot be null");
        Objects.requireNonNull(email, "Email cannot be null");
        Objects.requireNonNull(password, "Password cannot be null");
        Objects.requireNonNull(name, "Name cannot be null");
        Objects.requireNonNull(timeZone, "TimeZone cannot be null");
        Objects.requireNonNull(currency, "Currency cannot be null");
        if (budgetClosingDay < 1 || budgetClosingDay > 31) {
            throw new IllegalArgumentException("Budget closing day must be between 1 and 31");
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    public User updateProfile(String name, String timeZone, String currency, int budgetClosingDay) {
        return new User(
            this.id,
            this.email,
            this.password,
            name,
            timeZone,
            currency,
            budgetClosingDay,
            this.createdAt,
            Instant.now()
        );
    }
}
