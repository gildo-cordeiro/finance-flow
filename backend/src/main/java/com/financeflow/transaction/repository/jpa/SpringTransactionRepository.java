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
           "AND (:startDate IS NULL OR t.competenceDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.competenceDate <= :endDate) " +
           "AND (:categoryId IS NULL OR t.categoryId = :categoryId) " +
           "AND (:accountId IS NULL OR t.accountId = :accountId) " +
           "ORDER BY t.competenceDate DESC, t.createdAt DESC")
    List<TransactionEntity> findAllFiltered(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("categoryId") UUID categoryId,
        @Param("accountId") UUID accountId
    );
}
