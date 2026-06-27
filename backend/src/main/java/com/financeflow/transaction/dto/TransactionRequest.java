package com.financeflow.transaction.dto;

import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
    @NotNull(message = "AccountId cannot be null") UUID accountId,
    @NotNull(message = "CategoryId cannot be null") UUID categoryId,
    @NotBlank(message = "Description cannot be blank") String description,
    @NotNull(message = "Amount cannot be null")
    @DecimalMin(value = "0.0001", message = "Amount must be greater than zero")
    BigDecimal amount,
    @NotNull(message = "Type cannot be null") TransactionType type,
    LocalDate competenceDate,
    @NotNull(message = "DueDate cannot be null") LocalDate dueDate,
    LocalDate paymentDate,
    @NotNull(message = "Status cannot be null") TransactionStatus status,
    @NotNull(message = "Visibility cannot be null") TransactionVisibility visibility,
    Integer totalInstallments,
    Boolean isRecurring,
    String recurrenceRule
) {
    public TransactionRequest(
        UUID accountId,
        UUID categoryId,
        String description,
        BigDecimal amount,
        TransactionType type,
        LocalDate competenceDate,
        LocalDate dueDate,
        LocalDate paymentDate,
        TransactionStatus status,
        TransactionVisibility visibility
    ) {
        this(accountId, categoryId, description, amount, type, competenceDate, dueDate, paymentDate, status, visibility, null, null, null);
    }
}
