package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DeleteTransactionUseCaseTest {

    private TransactionRepository transactionRepository;
    private AccountRepository accountRepository;
    private DeleteTransactionUseCase deleteTransactionUseCase;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        accountRepository = mock(AccountRepository.class);
        deleteTransactionUseCase = new DeleteTransactionUseCase(
            transactionRepository, accountRepository
        );
    }

    @Test
    void shouldDeleteSingleTransactionSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        TransactionEntity entity = new TransactionEntity(
            txId, userId, accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            null, TransactionStatus.PENDING, TransactionVisibility.PERSONAL,
            null, null, null, false, null, null, Instant.now(), Instant.now()
        );

        when(transactionRepository.findById(txId)).thenReturn(Optional.of(entity));

        deleteTransactionUseCase.execute(userId, txId, "ONLY_THIS");

        verify(transactionRepository).delete(entity);
    }

    @Test
    void shouldDeleteAllTransactionsInInstallmentGroupSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UUID txId1 = UUID.randomUUID();
        UUID txId2 = UUID.randomUUID();
        UUID instGroupId = UUID.randomUUID();

        TransactionEntity t1 = new TransactionEntity(
            txId1, userId, accountId, categoryId, "Laptop (1/2)", new BigDecimal("150.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 20), LocalDate.of(2026, 6, 20),
            null, TransactionStatus.PLANNED, TransactionVisibility.PERSONAL,
            instGroupId, 1, 2, false, null, null, Instant.now(), Instant.now()
        );

        TransactionEntity t2 = new TransactionEntity(
            txId2, userId, accountId, categoryId, "Laptop (2/2)", new BigDecimal("150.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 7, 20), LocalDate.of(2026, 7, 20),
            null, TransactionStatus.PLANNED, TransactionVisibility.PERSONAL,
            instGroupId, 2, 2, false, null, null, Instant.now(), Instant.now()
        );

        when(transactionRepository.findById(txId1)).thenReturn(Optional.of(t1));
        when(transactionRepository.findByInstallmentGroupId(instGroupId)).thenReturn(List.of(t1, t2));

        deleteTransactionUseCase.execute(userId, txId1, "ALL");

        verify(transactionRepository).deleteAll(List.of(t1, t2));
    }
}
