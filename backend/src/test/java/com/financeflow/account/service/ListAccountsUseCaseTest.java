package com.financeflow.account.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ListAccountsUseCaseTest {

    private AccountRepository accountRepository;
    private ListAccountsUseCase listAccountsUseCase;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        listAccountsUseCase = new ListAccountsUseCase(accountRepository);
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoAccounts() {
        UUID userId = UUID.randomUUID();
        when(accountRepository.findAllByUserId(userId)).thenReturn(List.of());

        List<AccountResponse> result = listAccountsUseCase.execute(userId);

        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnAccountListWhenUserHasAccounts() {
        UUID userId = UUID.randomUUID();
        AccountEntity account1 = new AccountEntity(
            UUID.randomUUID(), userId, "Checking Account", AccountType.CHECKING, "Bank A",
            new BigDecimal("100.00"), null, null, null, null, Instant.now(), Instant.now()
        );
        AccountEntity account2 = new AccountEntity(
            UUID.randomUUID(), userId, "Credit Card", AccountType.CREDIT_CARD, "Bank B",
            new BigDecimal("-50.00"), new BigDecimal("1000.00"), 5, 10, null, Instant.now(), Instant.now()
        );

        when(accountRepository.findAllByUserId(userId)).thenReturn(List.of(account1, account2));

        List<AccountResponse> result = listAccountsUseCase.execute(userId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Checking Account");
        assertThat(result.get(1).name()).isEqualTo("Credit Card");
        assertThat(result.get(1).creditLimit()).isEqualTo(new BigDecimal("1000.00"));
    }
}
