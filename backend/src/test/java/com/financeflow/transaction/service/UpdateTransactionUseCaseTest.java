package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.transaction.dto.TransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UpdateTransactionUseCaseTest {

    private TransactionRepository transactionRepository;
    private AccountRepository accountRepository;
    private CategoryRepository categoryRepository;
    private UpdateTransactionUseCase updateTransactionUseCase;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        accountRepository = mock(AccountRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        updateTransactionUseCase = new UpdateTransactionUseCase(
            transactionRepository, accountRepository, categoryRepository
        );
    }

    @Test
    void shouldUpdateSingleTransactionSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        AccountEntity account = new AccountEntity(
            accountId, userId, "Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, null, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Food", null, Instant.now(), Instant.now()
        );

        TransactionEntity entity = new TransactionEntity(
            txId, userId, accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            null, TransactionStatus.PENDING, TransactionVisibility.PERSONAL,
            null, null, null, false, null, null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch Updated", new BigDecimal("60.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 10), null,
            TransactionStatus.PENDING, TransactionVisibility.PERSONAL,
            null, false, null
        );

        when(transactionRepository.findById(txId)).thenReturn(Optional.of(entity));
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionResponse response = updateTransactionUseCase.execute(userId, txId, request, "ONLY_THIS");

        assertThat(response).isNotNull();
        assertThat(response.description()).isEqualTo("Lunch Updated");
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("60.00"));
        verify(transactionRepository).save(entity);
    }

    @Test
    void shouldUpdateAllTransactionsInInstallmentGroupSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UUID txId1 = UUID.randomUUID();
        UUID txId2 = UUID.randomUUID();
        UUID instGroupId = UUID.randomUUID();

        AccountEntity account = new AccountEntity(
            accountId, userId, "Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, null, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Laptop", null, Instant.now(), Instant.now()
        );

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

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Super Laptop", new BigDecimal("150.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 20), null,
            TransactionStatus.PLANNED, TransactionVisibility.PERSONAL,
            null, false, null
        );

        when(transactionRepository.findById(txId1)).thenReturn(Optional.of(t1));
        when(transactionRepository.findByInstallmentGroupId(instGroupId)).thenReturn(List.of(t1, t2));
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionResponse response = updateTransactionUseCase.execute(userId, txId1, request, "ALL");

        assertThat(response).isNotNull();
        assertThat(t1.getDescription()).isEqualTo("Super Laptop (1/2)");
        assertThat(t2.getDescription()).isEqualTo("Super Laptop (2/2)");
        verify(transactionRepository).save(t1);
        verify(transactionRepository).save(t2);
    }
}
