package com.financeflow.budget.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.shared.exception.ValidationException;
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
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetBudgetUseCaseTest {

    private BudgetRepository budgetRepository;
    private CategoryRepository categoryRepository;
    private TransactionRepository transactionRepository;
    private GetBudgetUseCase getBudgetUseCase;

    @BeforeEach
    void setUp() {
        budgetRepository = mock(BudgetRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        getBudgetUseCase = new GetBudgetUseCase(budgetRepository, categoryRepository, transactionRepository);
    }

    @Test
    void shouldGetBudgetSuccessfullyAndCalculateRealizedAmounts() {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";

        UUID incomeCatId = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000001"); // Receitas
        UUID salaryCatId = UUID.randomUUID(); // Salary (sub of Receitas)
        UUID foodCatId = UUID.randomUUID(); // Food (expense)

        CategoryEntity incomeCat = new CategoryEntity(incomeCatId, null, "Receitas", null, Instant.now(), Instant.now());
        CategoryEntity salaryCat = new CategoryEntity(salaryCatId, userId, "Salário", incomeCatId, Instant.now(), Instant.now());
        CategoryEntity foodCat = new CategoryEntity(foodCatId, userId, "Alimentação", null, Instant.now(), Instant.now());

        when(categoryRepository.findAllByUserId(userId)).thenReturn(List.of(incomeCat, salaryCat, foodCat));

        BudgetEntity salaryBudget = new BudgetEntity(UUID.randomUUID(), userId, salaryCatId, month, new BigDecimal("5000.00"), Instant.now(), Instant.now());
        BudgetEntity foodBudget = new BudgetEntity(UUID.randomUUID(), userId, foodCatId, month, new BigDecimal("800.00"), Instant.now(), Instant.now());

        when(budgetRepository.findAllByUserIdAndMonth(userId, month)).thenReturn(List.of(salaryBudget, foodBudget));

        TransactionEntity salaryTx = new TransactionEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), salaryCatId, "Monthly Salary", new BigDecimal("5200.00"),
            TransactionType.INCOME, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 5), null,
            TransactionStatus.PAID, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        TransactionEntity foodTx1 = new TransactionEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), foodCatId, "Supermarket", new BigDecimal("150.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10), null,
            TransactionStatus.PAID, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        TransactionEntity foodRefundTx = new TransactionEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), foodCatId, "Refund", new BigDecimal("20.00"),
            TransactionType.INCOME, LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 12), null,
            TransactionStatus.PAID, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        when(transactionRepository.findAllFiltered(
            eq(userId), eq(LocalDate.of(2026, 6, 1)), eq(LocalDate.of(2026, 6, 30)), any(), any()
        )).thenReturn(List.of(salaryTx, foodTx1, foodRefundTx));

        BudgetResponse response = getBudgetUseCase.execute(userId, month);

        assertThat(response.month()).isEqualTo(month);
        assertThat(response.items()).hasSize(3);

        BudgetItemResponse salaryItem = response.items().stream().filter(i -> i.categoryId().equals(salaryCatId)).findFirst().orElseThrow();
        assertThat(salaryItem.plannedAmount()).isEqualByComparingTo("5000.00");
        assertThat(salaryItem.realizedAmount()).isEqualByComparingTo("5200.00"); // 5200.00 income

        BudgetItemResponse foodItem = response.items().stream().filter(i -> i.categoryId().equals(foodCatId)).findFirst().orElseThrow();
        assertThat(foodItem.plannedAmount()).isEqualByComparingTo("800.00");
        assertThat(foodItem.realizedAmount()).isEqualByComparingTo("130.00"); // 150.00 expense - 20.00 refund
    }

    @Test
    void shouldThrowExceptionWhenMonthFormatIsInvalid() {
        UUID userId = UUID.randomUUID();
        assertThatThrownBy(() -> getBudgetUseCase.execute(userId, "06-2026"))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Month must be in YYYY-MM format");
    }
}
