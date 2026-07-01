package com.financeflow.account.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.dto.UpdateAccountRequest;
import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UpdateAccountUseCaseTest {

    private AccountRepository accountRepository;
    private UpdateAccountUseCase updateAccountUseCase;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
    }

    @Test
    void shouldUpdateCheckingAccountSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "Old Name", AccountType.CHECKING, "Old Bank",
            new BigDecimal("100.00"), null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateAccountRequest request = new UpdateAccountRequest("New Name", "New Bank", new BigDecimal("200.00"), null, null, null);
        AccountResponse response = updateAccountUseCase.execute(userId, accountId, request);

        assertThat(response.name()).isEqualTo("New Name");
        assertThat(response.bank()).isEqualTo("New Bank");
        assertThat(response.balance()).isEqualTo(new BigDecimal("200.00"));
        assertThat(response.status()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void shouldUpdateCreditCardSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "Old Card", AccountType.CREDIT_CARD, "Old Bank",
            new BigDecimal("0.00"), new BigDecimal("1000.00"), 5, 10, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateAccountRequest request = new UpdateAccountRequest("New Card", "New Bank", null, new BigDecimal("2000.00"), 15, 20);
        AccountResponse response = updateAccountUseCase.execute(userId, accountId, request);

        assertThat(response.name()).isEqualTo("New Card");
        assertThat(response.creditLimit()).isEqualTo(new BigDecimal("2000.00"));
        assertThat(response.closingDay()).isEqualTo(15);
        assertThat(response.dueDay()).isEqualTo(20);
    }

    @Test
    void shouldThrowNotFoundWhenAccountDoesNotExist() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        when(accountRepository.findById(accountId)).thenReturn(Optional.empty());

        UpdateAccountRequest request = new UpdateAccountRequest("Name", "Bank", null, null, null, null);

        assertThatThrownBy(() -> updateAccountUseCase.execute(userId, accountId, request))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldThrowForbiddenWhenAccountDoesNotBelongToUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, otherUserId, "Name", AccountType.CHECKING, "Bank",
            new BigDecimal("100.00"), null, null, null, null, AccountStatus.ACTIVE, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));

        UpdateAccountRequest request = new UpdateAccountRequest("Name", "Bank", null, null, null, null);

        assertThatThrownBy(() -> updateAccountUseCase.execute(userId, accountId, request))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void shouldThrowBusinessExceptionWhenAccountIsClosed() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        AccountEntity entity = new AccountEntity(
            accountId, userId, "Name", AccountType.CHECKING, "Bank",
            new BigDecimal("0.00"), null, null, null, null, AccountStatus.CLOSED, null, null
        );

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(entity));

        UpdateAccountRequest request = new UpdateAccountRequest("Name", "Bank", null, null, null, null);

        assertThatThrownBy(() -> updateAccountUseCase.execute(userId, accountId, request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Cannot edit a closed account");
    }
}
