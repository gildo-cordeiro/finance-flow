package com.financeflow.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.dashboard.dto.DashboardSummaryResponse;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetDashboardSummaryUseCaseTest {

    private CategoryRepository categoryRepository;
    private TransactionRepository transactionRepository;
    private BudgetRepository budgetRepository;
    private GetDashboardSummaryUseCase getDashboardSummaryUseCase;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        budgetRepository = mock(BudgetRepository.class);
        getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(categoryRepository, transactionRepository, budgetRepository);
    }

    @Test
    void shouldGetDashboardSummarySuccessfully() {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";

        UUID incomeCatId = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000001");
        UUID salaryCatId = UUID.randomUUID();
        UUID foodCatId = UUID.randomUUID();

        CategoryEntity incomeCat = new CategoryEntity(incomeCatId, null, "Receitas", null, Instant.now(), Instant.now());
        CategoryEntity salaryCat = new CategoryEntity(salaryCatId, userId, "Salário", incomeCatId, Instant.now(), Instant.now());
        CategoryEntity foodCat = new CategoryEntity(foodCatId, userId, "Alimentação", null, Instant.now(), Instant.now());

        when(categoryRepository.findAllByUserId(userId)).thenReturn(List.of(incomeCat, salaryCat, foodCat));

        BudgetEntity salaryBudget = new BudgetEntity(UUID.randomUUID(), userId, salaryCatId, month, new BigDecimal("5000.00"), Instant.now(), Instant.now());
        BudgetEntity foodBudget = new BudgetEntity(UUID.randomUUID(), userId, foodCatId, month, new BigDecimal("800.00"), Instant.now(), Instant.now());

        when(budgetRepository.findAllByUserIdAndMonth(userId, month)).thenReturn(List.of(salaryBudget, foodBudget));

        TransactionEntity salaryTx = new TransactionEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), salaryCatId, "Monthly Salary", new BigDecimal("5200.00"),
            TransactionType.INCOME, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 5),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        TransactionEntity foodTx1 = new TransactionEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), foodCatId, "Supermarket", new BigDecimal("150.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        TransactionEntity foodRefundTx = new TransactionEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), foodCatId, "Refund", new BigDecimal("20.00"),
            TransactionType.INCOME, LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 12),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        when(transactionRepository.findAllFiltered(
            eq(userId), eq(LocalDate.of(2026, 6, 1)), eq(LocalDate.of(2026, 6, 30)), any(), any()
        )).thenReturn(List.of(salaryTx, foodTx1, foodRefundTx));

        DashboardSummaryResponse response = getDashboardSummaryUseCase.execute(userId, month);

        assertThat(response.totalRevenue()).isEqualByComparingTo("5220.00"); // 5200.00 salary + 20.00 refund (income)
        assertThat(response.totalExpenses()).isEqualByComparingTo("150.00"); // 150.00 food expense
        assertThat(response.balance()).isEqualByComparingTo("5070.00"); // 5220.00 - 150.00
        assertThat(response.budgetPlanned()).isEqualByComparingTo("800.00"); // Only food (expense) planned
        assertThat(response.budgetRealized()).isEqualByComparingTo("130.00"); // 150.00 food expense - 20.00 refund
    }

    @Test
    void shouldThrowExceptionWhenMonthFormatIsInvalid() {
        UUID userId = UUID.randomUUID();
        assertThatThrownBy(() -> getDashboardSummaryUseCase.execute(userId, "06-2026"))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Month must be in YYYY-MM format");
    }
}
