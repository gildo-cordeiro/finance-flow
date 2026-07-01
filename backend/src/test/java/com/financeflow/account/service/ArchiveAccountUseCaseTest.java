package com.financeflow.account.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ArchiveAccountUseCaseTest {

    private AccountRepository accountRepository;
    private TransactionRepository transactionRepository;
    private ArchiveAccountUseCase archiveAccountUseCase;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        archiveAccountUseCase = new ArchiveAccountUseCase(accountRepository, transactionRepository);
    }

    @Test
    void shouldArchiveCheckingAccountSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "My Account", AccountType.CHECKING, "Bank A",
            new BigDecimal("100.00"), null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        archiveAccountUseCase.execute(userId, accountId);

        verify(accountRepository).save(any());
    }

    @Test
    void shouldArchiveCreditCardWithNoPendingTransactions() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "My Card", AccountType.CREDIT_CARD, "Bank B",
            new BigDecimal("0.00"), new BigDecimal("1000.00"), 5, 10, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(transactionRepository.existsByAccountIdAndStatusIn(
            accountId, List.of(TransactionStatus.PENDING, TransactionStatus.PLANNED)
        )).thenReturn(false);
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        archiveAccountUseCase.execute(userId, accountId);

        verify(accountRepository).save(any());
    }

    @Test
    void shouldThrowBusinessExceptionWhenCreditCardHasPendingTransactions() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "My Card", AccountType.CREDIT_CARD, "Bank B",
            new BigDecimal("0.00"), new BigDecimal("1000.00"), 5, 10, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(transactionRepository.existsByAccountIdAndStatusIn(
            accountId, List.of(TransactionStatus.PENDING, TransactionStatus.PLANNED)
        )).thenReturn(true);

        assertThatThrownBy(() -> archiveAccountUseCase.execute(userId, accountId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("PENDING or PLANNED transactions");
    }

    @Test
    void shouldThrowBusinessExceptionWhenAlreadyArchived() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "My Account", AccountType.CHECKING, "Bank A",
            new BigDecimal("100.00"), null, null, null, null, AccountStatus.ARCHIVED, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> archiveAccountUseCase.execute(userId, accountId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("already archived");
    }

    @Test
    void shouldThrowForbiddenWhenAccountDoesNotBelongToUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, otherUserId, "My Account", AccountType.CHECKING, "Bank A",
            new BigDecimal("100.00"), null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> archiveAccountUseCase.execute(userId, accountId))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void shouldThrowNotFoundWhenAccountDoesNotExist() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        when(accountRepository.findById(accountId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> archiveAccountUseCase.execute(userId, accountId))
            .isInstanceOf(NotFoundException.class);
    }
}
