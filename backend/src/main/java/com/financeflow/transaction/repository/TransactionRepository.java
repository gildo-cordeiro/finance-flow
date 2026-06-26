package com.financeflow.transaction.repository;

import com.financeflow.transaction.model.entity.TransactionEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository {
    List<TransactionEntity> findAllFiltered(
        UUID userId,
        LocalDate startDate,
        LocalDate endDate,
        UUID categoryId,
        UUID accountId
    );
    List<TransactionEntity> findAllForCashFlow(
        UUID userId,
        LocalDate fromDate,
        LocalDate toDate
    );
    Optional<TransactionEntity> findById(UUID id);
    TransactionEntity save(TransactionEntity transaction);
    void delete(TransactionEntity transaction);
}
