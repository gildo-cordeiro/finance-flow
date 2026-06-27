package com.financeflow.transaction.repository.jpa;

import com.financeflow.transaction.model.entity.TransactionEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringTransactionRepository extends JpaRepository<TransactionEntity, UUID> {

    @Query("SELECT t FROM TransactionEntity t WHERE t.userId = :userId " +
           "AND (cast(:startDate as LocalDate) IS NULL OR t.competenceDate >= :startDate) " +
           "AND (cast(:endDate as LocalDate) IS NULL OR t.competenceDate <= :endDate) " +
           "AND (cast(:categoryId as uuid) IS NULL OR t.categoryId = :categoryId) " +
           "AND (cast(:accountId as uuid) IS NULL OR t.accountId = :accountId) " +
           "ORDER BY t.competenceDate DESC, t.createdAt DESC")
    List<TransactionEntity> findAllFiltered(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("categoryId") UUID categoryId,
        @Param("accountId") UUID accountId
    );

    @Query("SELECT t FROM TransactionEntity t WHERE " +
           "((t.userId = :userId) OR (t.userId = :partnerId AND t.visibility = com.financeflow.transaction.model.domain.TransactionVisibility.SHARED)) " +
           "AND (cast(:startDate as LocalDate) IS NULL OR t.competenceDate >= :startDate) " +
           "AND (cast(:endDate as LocalDate) IS NULL OR t.competenceDate <= :endDate) " +
           "AND (cast(:categoryId as uuid) IS NULL OR t.categoryId = :categoryId) " +
           "AND (cast(:accountId as uuid) IS NULL OR t.accountId = :accountId) " +
           "ORDER BY t.competenceDate DESC, t.createdAt DESC")
    List<TransactionEntity> findAllFilteredCouple(
        @Param("userId") UUID userId,
        @Param("partnerId") UUID partnerId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("categoryId") UUID categoryId,
        @Param("accountId") UUID accountId
    );


    @Query("SELECT t FROM TransactionEntity t WHERE t.userId = :userId " +
           "AND ((t.status = com.financeflow.transaction.model.domain.TransactionStatus.PAID AND t.paymentDate >= :fromDate) " +
           "OR (t.status <> com.financeflow.transaction.model.domain.TransactionStatus.PAID AND t.dueDate <= :toDate))")
    List<TransactionEntity> findAllForCashFlow(
        @Param("userId") UUID userId,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate
    );

    List<TransactionEntity> findByInstallmentGroupId(UUID installmentGroupId);
    List<TransactionEntity> findByRecurrenceGroupId(UUID recurrenceGroupId);
}
