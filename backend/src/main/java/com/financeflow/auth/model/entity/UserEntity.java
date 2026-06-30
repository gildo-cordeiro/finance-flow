package com.financeflow.auth.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
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

    @Column(name = "date_format", nullable = false)
    private String dateFormat;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserEntity() {
        // JPA requirement
    }

    public UserEntity(UUID id, String email, String password, String name, String timeZone, String currency, int budgetClosingDay, String dateFormat, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.name = name;
        this.timeZone = timeZone;
        this.currency = currency;
        this.budgetClosingDay = budgetClosingDay;
        this.dateFormat = dateFormat;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UserEntity(UUID id, String email, String password, String name, String timeZone, String currency, int budgetClosingDay, Instant createdAt, Instant updatedAt) {
        this(id, email, password, name, timeZone, currency, budgetClosingDay, "dd/MM/yyyy", createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public int getBudgetClosingDay() {
        return budgetClosingDay;
    }

    public void setBudgetClosingDay(int budgetClosingDay) {
        this.budgetClosingDay = budgetClosingDay;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
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
}
