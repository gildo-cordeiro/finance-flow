package com.financeflow.budget.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.shared.exception.ValidationException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CopyBudgetUseCaseTest {

    private BudgetRepository budgetRepository;
    private GetBudgetUseCase getBudgetUseCase;
    private CopyBudgetUseCase copyBudgetUseCase;

    @BeforeEach
    void setUp() {
        budgetRepository = mock(BudgetRepository.class);
        getBudgetUseCase = mock(GetBudgetUseCase.class);
        copyBudgetUseCase = new CopyBudgetUseCase(budgetRepository, getBudgetUseCase);
    }

    @Test
    void shouldCopyBudgetsFromPreviousMonthSuccessfully() {
        UUID userId = UUID.randomUUID();
        String targetMonth = "2026-06";
        String previousMonth = "2026-05";

        UUID categoryId1 = UUID.randomUUID();
        UUID categoryId2 = UUID.randomUUID();

        BudgetEntity prevBudget1 = new BudgetEntity(UUID.randomUUID(), userId, categoryId1, previousMonth, new BigDecimal("100.00"), Instant.now(), Instant.now());
        BudgetEntity prevBudget2 = new BudgetEntity(UUID.randomUUID(), userId, categoryId2, previousMonth, new BigDecimal("200.00"), Instant.now(), Instant.now());

        when(budgetRepository.findAllByUserIdAndMonth(userId, previousMonth)).thenReturn(List.of(prevBudget1, prevBudget2));

        // Let's assume category 1 already has a target budget, category 2 does not.
        BudgetEntity existingTargetBudget1 = new BudgetEntity(UUID.randomUUID(), userId, categoryId1, targetMonth, new BigDecimal("50.00"), Instant.now(), Instant.now());

        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(userId, categoryId1, targetMonth)).thenReturn(Optional.of(existingTargetBudget1));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(userId, categoryId2, targetMonth)).thenReturn(Optional.empty());

        BudgetResponse mockResponse = new BudgetResponse(targetMonth, List.of());
        when(getBudgetUseCase.execute(userId, targetMonth)).thenReturn(mockResponse);

        BudgetResponse response = copyBudgetUseCase.execute(userId, targetMonth);

        assertThat(response).isEqualTo(mockResponse);
        verify(budgetRepository).saveAll(anyList());
    }

    @Test
    void shouldThrowValidationExceptionWhenTargetMonthFormatIsInvalid() {
        UUID userId = UUID.randomUUID();
        assertThatThrownBy(() -> copyBudgetUseCase.execute(userId, "invalid-month"))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Month must be in YYYY-MM format");
    }
}
