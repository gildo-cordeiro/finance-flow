package com.financeflow.transaction.repository;

import com.financeflow.transaction.model.domain.TransactionStatus;
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
    List<TransactionEntity> findAllFilteredCouple(
        UUID userId,
        UUID partnerId,
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
    List<TransactionEntity> findAllForCashFlowCouple(
        UUID userId,
        UUID partnerId,
        LocalDate fromDate,
        LocalDate toDate
    );
    Optional<TransactionEntity> findById(UUID id);
    TransactionEntity save(TransactionEntity transaction);
    void delete(TransactionEntity transaction);
    List<TransactionEntity> findByInstallmentGroupId(UUID installmentGroupId);
    List<TransactionEntity> findByRecurrenceGroupId(UUID recurrenceGroupId);
    void deleteAll(List<TransactionEntity> transactions);
    boolean existsByAccountId(UUID accountId);
    boolean existsByAccountIdAndStatusIn(UUID accountId, List<TransactionStatus> statuses);
}
