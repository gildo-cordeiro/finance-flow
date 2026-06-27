package com.financeflow.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.dashboard.dto.DashboardSummaryResponse;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.service.ListCategoriesUseCase;
import com.financeflow.transaction.service.ListTransactionsUseCase;
import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.service.GetBudgetUseCase;
import com.financeflow.couple.repository.CoupleRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetDashboardSummaryUseCaseTest {

    private ListCategoriesUseCase listCategoriesUseCase;
    private ListTransactionsUseCase listTransactionsUseCase;
    private GetBudgetUseCase getBudgetUseCase;
    private CoupleRepository coupleRepository;
    private GetDashboardSummaryUseCase getDashboardSummaryUseCase;

    @BeforeEach
    void setUp() {
        listCategoriesUseCase = mock(ListCategoriesUseCase.class);
        listTransactionsUseCase = mock(ListTransactionsUseCase.class);
        getBudgetUseCase = mock(GetBudgetUseCase.class);
        coupleRepository = mock(CoupleRepository.class);
        getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(listCategoriesUseCase, listTransactionsUseCase, getBudgetUseCase, coupleRepository);
    }

    @Test
    void shouldGetDashboardSummarySuccessfully() {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";

        UUID incomeCatId = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000001");
        UUID salaryCatId = UUID.randomUUID();
        UUID foodCatId = UUID.randomUUID();

        CategoryResponse incomeCat = new CategoryResponse(incomeCatId, null, "Receitas", null, TransactionVisibility.PERSONAL);
        CategoryResponse salaryCat = new CategoryResponse(salaryCatId, userId, "Salário", incomeCatId, TransactionVisibility.PERSONAL);
        CategoryResponse foodCat = new CategoryResponse(foodCatId, userId, "Alimentação", null, TransactionVisibility.PERSONAL);

        when(listCategoriesUseCase.execute(eq(userId), any())).thenReturn(List.of(incomeCat, salaryCat, foodCat));

        BudgetItemResponse salaryBudgetItem = new BudgetItemResponse(salaryCatId, "Salário", incomeCatId, new BigDecimal("5000.00"), new BigDecimal("5200.00"), userId);
        BudgetItemResponse foodBudgetItem = new BudgetItemResponse(foodCatId, "Alimentação", null, new BigDecimal("800.00"), new BigDecimal("130.00"), userId);
        BudgetItemResponse incomeBudgetItem = new BudgetItemResponse(incomeCatId, "Receitas", null, BigDecimal.ZERO, BigDecimal.ZERO, userId);

        when(getBudgetUseCase.execute(userId, month)).thenReturn(new BudgetResponse(month, List.of(salaryBudgetItem, foodBudgetItem, incomeBudgetItem)));

        TransactionResponse salaryTx = new TransactionResponse(
            UUID.randomUUID(), userId, UUID.randomUUID(), salaryCatId, "Monthly Salary", new BigDecimal("5200.00"),
            TransactionType.INCOME, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 5),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        TransactionResponse foodTx1 = new TransactionResponse(
            UUID.randomUUID(), userId, UUID.randomUUID(), foodCatId, "Supermarket", new BigDecimal("150.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        TransactionResponse foodRefundTx = new TransactionResponse(
            UUID.randomUUID(), userId, UUID.randomUUID(), foodCatId, "Refund", new BigDecimal("20.00"),
            TransactionType.INCOME, LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 12),
            TransactionStatus.PAID, TransactionVisibility.PERSONAL
        );

        when(listTransactionsUseCase.execute(
            eq(userId), any(), eq(LocalDate.of(2026, 6, 1)), eq(LocalDate.of(2026, 6, 30)), any(), any()
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
