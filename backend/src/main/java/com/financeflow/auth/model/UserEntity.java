package com.financeflow.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(name = "time_zone", nullable = false)
    private String timeZone;

    @Column(nullable = false)
    private String currency;

    @Column(name = "budget_closing_day", nullable = false)
    private int budgetClosingDay;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserEntity() {
        // JPA requirement
    }

    public UserEntity(UUID id, String email, String password, String name, String timeZone, String currency, int budgetClosingDay, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.name = name;
        this.timeZone = timeZone;
        this.currency = currency;
        this.budgetClosingDay = budgetClosingDay;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getName() {
        return name;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public String getCurrency() {
        return currency;
    }

    public int getBudgetClosingDay() {
        return budgetClosingDay;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateProfile(String name, String timeZone, String currency, int budgetClosingDay) {
        this.name = Objects.requireNonNull(name, "Name cannot be null");
        this.timeZone = Objects.requireNonNull(timeZone, "TimeZone cannot be null");
        this.currency = Objects.requireNonNull(currency, "Currency cannot be null");
        if (budgetClosingDay < 1 || budgetClosingDay > 31) {
            throw new IllegalArgumentException("Budget closing day must be between 1 and 31");
        }
        this.budgetClosingDay = budgetClosingDay;
        this.updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserEntity other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private UUID id;
        private String email;
        private String password;
        private String name;
        private String timeZone;
        private String currency;
        private int budgetClosingDay;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder timeZone(String timeZone) {
            this.timeZone = timeZone;
            return this;
        }

        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder budgetClosingDay(int budgetClosingDay) {
            this.budgetClosingDay = budgetClosingDay;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public UserEntity build() {
            Objects.requireNonNull(id, "id is required");
            Objects.requireNonNull(email, "email is required");
            Objects.requireNonNull(password, "password is required");
            Objects.requireNonNull(name, "name is required");
            Objects.requireNonNull(timeZone, "timeZone is required");
            Objects.requireNonNull(currency, "currency is required");
            if (budgetClosingDay < 1 || budgetClosingDay > 31) {
                throw new IllegalArgumentException("Budget closing day must be between 1 and 31");
            }
            Instant now = Instant.now();
            if (createdAt == null) {
                createdAt = now;
            }
            if (updatedAt == null) {
                updatedAt = now;
            }
            return new UserEntity(id, email, password, name, timeZone, currency, budgetClosingDay, createdAt, updatedAt);
        }
    }
}
