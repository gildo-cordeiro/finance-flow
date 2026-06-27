package com.financeflow.transaction.dto;

import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
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
    UUID recurrenceGroupId
) {
    public TransactionResponse(
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
        TransactionVisibility visibility
    ) {
        this(id, userId, accountId, categoryId, description, amount, type, competenceDate, dueDate, paymentDate, status, visibility, null, null, null, false, null, null);
    }
}
