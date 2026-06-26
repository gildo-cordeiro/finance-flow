package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.ValidationException;
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
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CreateTransactionUseCaseTest {

    private TransactionRepository transactionRepository;
    private AccountRepository accountRepository;
    private CategoryRepository categoryRepository;
    private CreateTransactionUseCase createTransactionUseCase;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        accountRepository = mock(AccountRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        createTransactionUseCase = new CreateTransactionUseCase(
            transactionRepository, accountRepository, categoryRepository
        );
    }

    @Test
    void shouldCreateIncomeTransactionSuccessfullyAndIncrementCheckingBalance() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity checkingAccount = new AccountEntity(
            accountId, userId, "My Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Salary", null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Salary payment", new BigDecimal("500.00"),
            TransactionType.INCOME, null, LocalDate.of(2026, 6, 20), LocalDate.of(2026, 6, 20),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(checkingAccount));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = createTransactionUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.amount()).isEqualTo(new BigDecimal("500.00"));
        assertThat(response.competenceDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(response.status()).isEqualTo(TransactionStatus.PAID);
        assertThat(checkingAccount.getBalance()).isEqualTo(new BigDecimal("1500.00"));
        verify(accountRepository).save(checkingAccount);
    }

    @Test
    void shouldCreateExpenseTransactionSuccessfullyAndDecrementCheckingBalance() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity checkingAccount = new AccountEntity(
            accountId, userId, "My Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Food", null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 20), LocalDate.of(2026, 6, 20),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(checkingAccount));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = createTransactionUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.amount()).isEqualTo(new BigDecimal("50.00"));
        assertThat(checkingAccount.getBalance()).isEqualTo(new BigDecimal("950.00"));
        verify(accountRepository).save(checkingAccount);
    }

    @Test
    void shouldSuggestCurrentMonthCompetenceForCreditCardBeforeClosingDay() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity cardAccount = new AccountEntity(
            accountId, userId, "My Card", AccountType.CREDIT_CARD, "Bank A",
            new BigDecimal("0.00"), new BigDecimal("5000.00"), 10, 20, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Food", null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 8), null,
            TransactionStatus.PENDING, TransactionVisibility.PERSONAL
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(cardAccount));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = createTransactionUseCase.execute(userId, request);

        assertThat(response.competenceDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 6, 20));
    }

    @Test
    void shouldSuggestNextMonthCompetenceForCreditCardAfterClosingDay() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity cardAccount = new AccountEntity(
            accountId, userId, "My Card", AccountType.CREDIT_CARD, "Bank A",
            new BigDecimal("0.00"), new BigDecimal("5000.00"), 10, 20, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Food", null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 12), null,
            TransactionStatus.PENDING, TransactionVisibility.PERSONAL
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(cardAccount));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = createTransactionUseCase.execute(userId, request);

        assertThat(response.competenceDate()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 7, 20));
    }

    @Test
    void shouldCalculateInvoiceDueDateAndPaymentDateForPaidCreditCardTransaction() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity cardAccount = new AccountEntity(
            accountId, userId, "My Card", AccountType.CREDIT_CARD, "Bank A",
            new BigDecimal("0.00"), new BigDecimal("5000.00"), 28, 5, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Food", null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Dinner", new BigDecimal("100.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 25), LocalDate.of(2026, 6, 25),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(cardAccount));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(TransactionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = createTransactionUseCase.execute(userId, request);

        assertThat(response.competenceDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 7, 5));
        assertThat(response.paymentDate()).isEqualTo(LocalDate.of(2026, 7, 5));
        assertThat(cardAccount.getBalance()).isEqualTo(new BigDecimal("-100.00"));
        verify(accountRepository).save(cardAccount);
    }

    @Test
    void shouldThrowExceptionWhenPaymentDateIsNullForPaidStatus() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity account = new AccountEntity(
            accountId, userId, "My Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, Instant.now(), Instant.now()
        );

        CategoryEntity category = new CategoryEntity(
            categoryId, userId, "Food", null, Instant.now(), Instant.now()
        );

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 12), null,
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> createTransactionUseCase.execute(userId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Payment date is required");
    }

    @Test
    void shouldThrowExceptionWhenAccountBelongsToAnotherUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        AccountEntity account = new AccountEntity(
            accountId, otherUserId, "My Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, Instant.now(), Instant.now()
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 12), null,
            TransactionStatus.PENDING, TransactionVisibility.PERSONAL
        );

        assertThatThrownBy(() -> createTransactionUseCase.execute(userId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Account does not belong to the user");
    }
}
