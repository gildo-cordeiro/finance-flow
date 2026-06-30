package com.financeflow.goals.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "goal_contributions")
public class GoalContributionEntity {

    @Id
    private UUID id;

    @Column(name = "goal_id", nullable = false)
    private UUID goalId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private BigDecimal amount;

    private String note;

    @Column(name = "contribution_date", nullable = false)
    private LocalDate contributionDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected GoalContributionEntity() {
        // JPA requirement
    }

    private GoalContributionEntity(Builder builder) {
        this.id = builder.id;
        this.goalId = builder.goalId;
        this.userId = builder.userId;
        this.amount = builder.amount;
        this.note = builder.note;
        this.contributionDate = builder.contributionDate;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getGoalId() {
        return goalId;
    }

    public void setGoalId(UUID goalId) {
        this.goalId = goalId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getContributionDate() {
        return contributionDate;
    }

    public void setContributionDate(LocalDate contributionDate) {
        this.contributionDate = contributionDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private UUID id;
        private UUID goalId;
        private UUID userId;
        private BigDecimal amount;
        private String note;
        private LocalDate contributionDate;
        private Instant createdAt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder goalId(UUID goalId) {
            this.goalId = goalId;
            return this;
        }

        public Builder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder note(String note) {
            this.note = note;
            return this;
        }

        public Builder contributionDate(LocalDate contributionDate) {
            this.contributionDate = contributionDate;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public GoalContributionEntity build() {
            Objects.requireNonNull(id, "id is required");
            Objects.requireNonNull(goalId, "goalId is required");
            Objects.requireNonNull(userId, "userId is required");
            Objects.requireNonNull(amount, "amount is required");
            Objects.requireNonNull(contributionDate, "contributionDate is required");
            return new GoalContributionEntity(this);
        }
    }
}
