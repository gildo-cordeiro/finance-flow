package com.financeflow.account.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CreateAccountUseCaseTest {

    private AccountRepository accountRepository;
    private CreateAccountUseCase createAccountUseCase;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        createAccountUseCase = new CreateAccountUseCase(accountRepository);
    }

    @Test
    void shouldCreateCheckingAccountSuccessfully() {
        UUID userId = UUID.randomUUID();
        AccountRequest request = new AccountRequest(
            "My Checking", AccountType.CHECKING, "Bank A", new BigDecimal("100.50"), null, null, null, null
        );

        when(accountRepository.save(any(AccountEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountResponse response = createAccountUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.name()).isEqualTo("My Checking");
        assertThat(response.type()).isEqualTo(AccountType.CHECKING);
        assertThat(response.balance()).isEqualTo(new BigDecimal("100.50"));
        assertThat(response.creditLimit()).isNull();
    }

    @Test
    void shouldCreateCreditCardAccountSuccessfully() {
        UUID userId = UUID.randomUUID();
        AccountRequest request = new AccountRequest(
            "My Card", AccountType.CREDIT_CARD, "Bank B", new BigDecimal("0.00"), new BigDecimal("5000.00"), 10, 20, null
        );

        when(accountRepository.save(any(AccountEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountResponse response = createAccountUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("My Card");
        assertThat(response.type()).isEqualTo(AccountType.CREDIT_CARD);
        assertThat(response.creditLimit()).isEqualTo(new BigDecimal("5000.00"));
        assertThat(response.closingDay()).isEqualTo(10);
        assertThat(response.dueDay()).isEqualTo(20);
    }

    @Test
    void shouldThrowExceptionWhenCreditCardFieldsAreMissing() {
        UUID userId = UUID.randomUUID();
        AccountRequest request = new AccountRequest(
            "My Card", AccountType.CREDIT_CARD, "Bank B", new BigDecimal("0.00"), null, null, null, null
        );

        assertThatThrownBy(() -> createAccountUseCase.execute(userId, request))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("Credit limit is required");
    }

    @Test
    void shouldThrowExceptionWhenCheckingAccountHasCreditCardFields() {
        UUID userId = UUID.randomUUID();
        AccountRequest request = new AccountRequest(
            "My Checking", AccountType.CHECKING, "Bank A", new BigDecimal("100.00"), new BigDecimal("500.00"), null, null, null
        );

        assertThatThrownBy(() -> createAccountUseCase.execute(userId, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Credit card fields must be null");
    }

    @Test
    void shouldCreateCreditCardWithAssociatedAccountSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID associatedAccountId = UUID.randomUUID();

        AccountEntity checkingAccount = new AccountEntity(
            associatedAccountId, userId, "Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, null, null, null
        );

        when(accountRepository.findById(associatedAccountId)).thenReturn(java.util.Optional.of(checkingAccount));
        when(accountRepository.save(any(AccountEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountRequest request = new AccountRequest(
            "My Card", AccountType.CREDIT_CARD, "Bank B", new BigDecimal("0.00"),
            new BigDecimal("5000.00"), 10, 20, associatedAccountId
        );

        AccountResponse response = createAccountUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.associatedAccountId()).isEqualTo(associatedAccountId);
    }

    @Test
    void shouldThrowExceptionWhenAssociatedAccountDoesNotBelongToUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID associatedAccountId = UUID.randomUUID();

        AccountEntity checkingAccount = new AccountEntity(
            associatedAccountId, otherUserId, "Checking", AccountType.CHECKING, "Bank A",
            new BigDecimal("1000.00"), null, null, null, null, null, null
        );

        when(accountRepository.findById(associatedAccountId)).thenReturn(java.util.Optional.of(checkingAccount));

        AccountRequest request = new AccountRequest(
            "My Card", AccountType.CREDIT_CARD, "Bank B", new BigDecimal("0.00"),
            new BigDecimal("5000.00"), 10, 20, associatedAccountId
        );

        assertThatThrownBy(() -> createAccountUseCase.execute(userId, request))
            .isInstanceOf(com.financeflow.shared.exception.DomainException.class)
            .hasMessageContaining("Associated account does not belong to the user");
    }

    @Test
    void shouldThrowExceptionWhenAssociatedAccountIsCreditCard() {
        UUID userId = UUID.randomUUID();
        UUID associatedAccountId = UUID.randomUUID();

        AccountEntity otherCard = new AccountEntity(
            associatedAccountId, userId, "Other Card", AccountType.CREDIT_CARD, "Bank A",
            new BigDecimal("0.00"), new BigDecimal("1000.00"), 10, 20, null, null, null
        );

        when(accountRepository.findById(associatedAccountId)).thenReturn(java.util.Optional.of(otherCard));

        AccountRequest request = new AccountRequest(
            "My Card", AccountType.CREDIT_CARD, "Bank B", new BigDecimal("0.00"),
            new BigDecimal("5000.00"), 10, 20, associatedAccountId
        );

        assertThatThrownBy(() -> createAccountUseCase.execute(userId, request))
            .isInstanceOf(com.financeflow.shared.exception.DomainException.class)
            .hasMessageContaining("A credit card cannot be associated with another credit card");
    }
}
