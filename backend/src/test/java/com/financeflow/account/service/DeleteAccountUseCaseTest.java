package com.financeflow.account.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DeleteAccountUseCaseTest {

    private AccountRepository accountRepository;
    private TransactionRepository transactionRepository;
    private DeleteAccountUseCase deleteAccountUseCase;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        deleteAccountUseCase = new DeleteAccountUseCase(accountRepository, transactionRepository);
    }

    @Test
    void shouldDeleteAccountWithNoTransactions() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "My Account", AccountType.CHECKING, "Bank A",
            BigDecimal.ZERO, null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(transactionRepository.existsByAccountId(accountId)).thenReturn(false);

        deleteAccountUseCase.execute(userId, accountId);

        verify(accountRepository).delete(entity);
    }

    @Test
    void shouldThrowBusinessExceptionWhenAccountHasTransactions() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "My Account", AccountType.CHECKING, "Bank A",
            new BigDecimal("100.00"), null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(transactionRepository.existsByAccountId(accountId)).thenReturn(true);

        assertThatThrownBy(() -> deleteAccountUseCase.execute(userId, accountId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Cannot permanently delete");
    }

    @Test
    void shouldThrowForbiddenWhenAccountDoesNotBelongToUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, otherUserId, "My Account", AccountType.CHECKING, "Bank A",
            BigDecimal.ZERO, null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> deleteAccountUseCase.execute(userId, accountId))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void shouldThrowNotFoundWhenAccountDoesNotExist() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        when(accountRepository.findById(accountId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteAccountUseCase.execute(userId, accountId))
            .isInstanceOf(NotFoundException.class);
    }
}
