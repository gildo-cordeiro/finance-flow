package com.financeflow.cashflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.cashflow.dto.CashFlowDailyPoint;
import com.financeflow.cashflow.dto.CashFlowResponse;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetCashFlowUseCaseTest {

    private AccountRepository accountRepository;
    private TransactionRepository transactionRepository;
    private GetCashFlowUseCase getCashFlowUseCase;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        getCashFlowUseCase = new GetCashFlowUseCase(accountRepository, transactionRepository);
    }

    @Test
    void shouldCalculateCashFlowAndTightnessCorrectly() {
        UUID userId = UUID.randomUUID();
        UUID accountId1 = UUID.randomUUID();

        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 5);

        // Account with current balance = 100.00
        AccountEntity account = new AccountEntity(
            accountId1, userId, "Checking", AccountType.CHECKING, "Bank X",
            new BigDecimal("100.00"), null, null, null, Instant.now(), Instant.now()
        );

        // Transactions:
        // 1. PAID Income on June 4 (future relative to some dates, past relative to others). Amount: 50.00. Payment date: June 4.
        TransactionEntity t1 = new TransactionEntity(
            UUID.randomUUID(), userId, accountId1, UUID.randomUUID(), "Salary",
            new BigDecimal("50.00"), TransactionType.INCOME, LocalDate.of(2026, 6, 4),
            LocalDate.of(2026, 6, 4), LocalDate.of(2026, 6, 4), TransactionStatus.PAID,
            TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        // 2. UNPAID Expense due on June 2. Amount: 120.00. Due date: June 2.
        TransactionEntity t2 = new TransactionEntity(
            UUID.randomUUID(), userId, accountId1, UUID.randomUUID(), "Rent",
            new BigDecimal("120.00"), TransactionType.EXPENSE, LocalDate.of(2026, 6, 2),
            LocalDate.of(2026, 6, 2), null, TransactionStatus.PENDING,
            TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        // 3. UNPAID Income due on June 5. Amount: 40.00. Due date: June 5.
        TransactionEntity t3 = new TransactionEntity(
            UUID.randomUUID(), userId, accountId1, UUID.randomUUID(), "Freelance",
            new BigDecimal("40.00"), TransactionType.INCOME, LocalDate.of(2026, 6, 5),
            LocalDate.of(2026, 6, 5), null, TransactionStatus.PENDING,
            TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        when(accountRepository.findAllByUserId(userId)).thenReturn(List.of(account));
        when(transactionRepository.findAllForCashFlow(userId, from, to)).thenReturn(List.of(t1, t2, t3));

        CashFlowResponse response = getCashFlowUseCase.execute(userId, from, to);

        assertThat(response.dailyPoints()).hasSize(5);

        // June 1:
        // PAID t1 (June 4) > June 1, so it is reverted (revert +50 => -50).
        // UNPAID t2 (June 2) due_date > June 1, not applied.
        // UNPAID t3 (June 5) due_date > June 1, not applied.
        // Balance = 100.00 - 50.00 = 50.00.
        CashFlowDailyPoint dp1 = response.dailyPoints().get(0);
        assertThat(dp1.date()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(dp1.consolidatedBalance()).isEqualByComparingTo("50.00");
        assertThat(dp1.income()).isEqualByComparingTo("0.00");
        assertThat(dp1.expense()).isEqualByComparingTo("0.00");

        // June 2:
        // PAID t1 (June 4) > June 2, reverted (-50).
        // UNPAID t2 (June 2) due_date <= June 2, applied (-120).
        // Balance = 100.00 - 50.00 - 120.00 = -70.00.
        CashFlowDailyPoint dp2 = response.dailyPoints().get(1);
        assertThat(dp2.date()).isEqualTo(LocalDate.of(2026, 6, 2));
        assertThat(dp2.consolidatedBalance()).isEqualByComparingTo("-70.00");
        assertThat(dp2.income()).isEqualByComparingTo("0.00");
        assertThat(dp2.expense()).isEqualByComparingTo("120.00");

        // June 3:
        // PAID t1 (June 4) > June 3, reverted (-50).
        // UNPAID t2 (June 2) due_date <= June 3, applied (-120).
        // Balance = 100.00 - 50.00 - 120.00 = -70.00.
        CashFlowDailyPoint dp3 = response.dailyPoints().get(2);
        assertThat(dp3.consolidatedBalance()).isEqualByComparingTo("-70.00");
        assertThat(dp3.income()).isEqualByComparingTo("0.00");
        assertThat(dp3.expense()).isEqualByComparingTo("0.00");

        // June 4:
        // PAID t1 (June 4) <= June 4, not reverted (+50 included).
        // UNPAID t2 (June 2) due_date <= June 4, applied (-120).
        // Balance = 100.00 - 120.00 = -20.00.
        CashFlowDailyPoint dp4 = response.dailyPoints().get(3);
        assertThat(dp4.consolidatedBalance()).isEqualByComparingTo("-20.00");
        assertThat(dp4.income()).isEqualByComparingTo("50.00");
        assertThat(dp4.expense()).isEqualByComparingTo("0.00");

        // June 5:
        // PAID t1 (June 4) <= June 5, not reverted (+50 included).
        // UNPAID t2 (June 2) due_date <= June 5, applied (-120).
        // UNPAID t3 (June 5) due_date <= June 5, applied (+40).
        // Balance = 100.00 - 120.00 + 40.00 = 20.00.
        CashFlowDailyPoint dp5 = response.dailyPoints().get(4);
        assertThat(dp5.consolidatedBalance()).isEqualByComparingTo("20.00");
        assertThat(dp5.income()).isEqualByComparingTo("40.00");
        assertThat(dp5.expense()).isEqualByComparingTo("0.00");

        // Tightness period:
        // June 2 to June 4 (3 days). Min balance: -70.00.
        assertThat(response.tightnessPeriods()).hasSize(1);
        assertThat(response.tightnessPeriods().get(0).startDate()).isEqualTo(LocalDate.of(2026, 6, 2));
        assertThat(response.tightnessPeriods().get(0).endDate()).isEqualTo(LocalDate.of(2026, 6, 4));
        assertThat(response.tightnessPeriods().get(0).minimumBalance()).isEqualByComparingTo("-70.00");
    }

    @Test
    void shouldThrowExceptionWhenFromDateIsAfterToDate() {
        UUID userId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 6, 10);
        LocalDate to = LocalDate.of(2026, 6, 5);

        assertThatThrownBy(() -> getCashFlowUseCase.execute(userId, from, to))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("To date must be after or equal to from date");
    }
}
