package com.financeflow.transaction.repository.jpa;

import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.TransactionRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaTransactionRepository implements TransactionRepository {

    private final SpringTransactionRepository springRepo;

    public JpaTransactionRepository(SpringTransactionRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public List<TransactionEntity> findAllFiltered(
        UUID userId,
        LocalDate startDate,
        LocalDate endDate,
        UUID categoryId,
        UUID accountId
    ) {
        return springRepo.findAllFiltered(userId, startDate, endDate, categoryId, accountId);
    }

    @Override
    public Optional<TransactionEntity> findById(UUID id) {
        return springRepo.findById(id);
    }

    @Override
    public TransactionEntity save(TransactionEntity transaction) {
        return springRepo.save(transaction);
    }

    @Override
    public void delete(TransactionEntity transaction) {
        springRepo.delete(transaction);
    }

    @Override
    public List<TransactionEntity> findAllForCashFlow(
        UUID userId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        return springRepo.findAllForCashFlow(userId, fromDate, toDate);
    }

    @Override
    public List<TransactionEntity> findByInstallmentGroupId(UUID installmentGroupId) {
        return springRepo.findByInstallmentGroupId(installmentGroupId);
    }

    @Override
    public List<TransactionEntity> findByRecurrenceGroupId(UUID recurrenceGroupId) {
        return springRepo.findByRecurrenceGroupId(recurrenceGroupId);
    }

    @Override
    public void deleteAll(List<TransactionEntity> transactions) {
        springRepo.deleteAll(transactions);
    }
}
