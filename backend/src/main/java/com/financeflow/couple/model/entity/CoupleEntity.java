package com.financeflow.couple.model.entity;

import com.financeflow.couple.model.domain.CoupleStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "couples")
public class CoupleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user1_id", nullable = false)
    private UUID user1Id;

    @Column(name = "user2_id", nullable = false)
    private UUID user2Id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CoupleStatus status;

    @Column(name = "invite_token")
    private String inviteToken;

    @Column(name = "invite_expires_at")
    private Instant inviteExpiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CoupleEntity() {
        // JPA requirement
    }

    private CoupleEntity(Builder builder) {
        this.id = builder.id;
        this.user1Id = builder.user1Id;
        this.user2Id = builder.user2Id;
        this.status = builder.status;
        this.inviteToken = builder.inviteToken;
        this.inviteExpiresAt = builder.inviteExpiresAt;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUser1Id() {
        return user1Id;
    }

    public void setUser1Id(UUID user1Id) {
        this.user1Id = user1Id;
    }

    public UUID getUser2Id() {
        return user2Id;
    }

    public void setUser2Id(UUID user2Id) {
        this.user2Id = user2Id;
    }

    public CoupleStatus getStatus() {
        return status;
    }

    public void setStatus(CoupleStatus status) {
        this.status = status;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public Instant getInviteExpiresAt() {
        return inviteExpiresAt;
    }

    public void setInviteExpiresAt(Instant inviteExpiresAt) {
        this.inviteExpiresAt = inviteExpiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private UUID id;
        private UUID user1Id;
        private UUID user2Id;
        private CoupleStatus status;
        private String inviteToken;
        private Instant inviteExpiresAt;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder user1Id(UUID user1Id) {
            this.user1Id = user1Id;
            return this;
        }

        public Builder user2Id(UUID user2Id) {
            this.user2Id = user2Id;
            return this;
        }

        public Builder status(CoupleStatus status) {
            this.status = status;
            return this;
        }

        public Builder inviteToken(String inviteToken) {
            this.inviteToken = inviteToken;
            return this;
        }

        public Builder inviteExpiresAt(Instant inviteExpiresAt) {
            this.inviteExpiresAt = inviteExpiresAt;
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

        public CoupleEntity build() {
            Objects.requireNonNull(user1Id, "user1Id is required");
            Objects.requireNonNull(user2Id, "user2Id is required");
            Objects.requireNonNull(status, "status is required");
            return new CoupleEntity(this);
        }
    }
}
