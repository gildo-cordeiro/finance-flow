package com.financeflow.budget.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.UpdateBudgetRequest;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UpdateBudgetUseCaseTest {

    private BudgetRepository budgetRepository;
    private CategoryRepository categoryRepository;
    private TransactionRepository transactionRepository;
    private UpdateBudgetUseCase updateBudgetUseCase;

    @BeforeEach
    void setUp() {
        budgetRepository = mock(BudgetRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        updateBudgetUseCase = new UpdateBudgetUseCase(budgetRepository, categoryRepository, transactionRepository);
    }

    @Test
    void shouldCreateNewBudgetWhenNoneExists() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        String month = "2026-06";
        BigDecimal plannedAmount = new BigDecimal("350.00");

        CategoryEntity category = new CategoryEntity(categoryId, userId, "Leisure", null, Instant.now(), Instant.now());
        UpdateBudgetRequest request = new UpdateBudgetRequest(plannedAmount);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(userId, categoryId, month)).thenReturn(Optional.empty());
        when(budgetRepository.save(any(BudgetEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BudgetItemResponse response = updateBudgetUseCase.execute(userId, month, categoryId, request);

        assertThat(response.categoryId()).isEqualTo(categoryId);
        assertThat(response.plannedAmount()).isEqualTo(plannedAmount);
        verify(budgetRepository).save(any(BudgetEntity.class));
    }

    @Test
    void shouldUpdateExistingBudget() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        String month = "2026-06";
        BigDecimal newAmount = new BigDecimal("500.00");

        CategoryEntity category = new CategoryEntity(categoryId, userId, "Leisure", null, Instant.now(), Instant.now());
        BudgetEntity existingBudget = new BudgetEntity(
            UUID.randomUUID(), userId, categoryId, month, new BigDecimal("200.00"), Instant.now(), Instant.now()
        );
        UpdateBudgetRequest request = new UpdateBudgetRequest(newAmount);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(budgetRepository.findByUserIdAndCategoryIdAndMonth(userId, categoryId, month)).thenReturn(Optional.of(existingBudget));
        when(budgetRepository.save(any(BudgetEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BudgetItemResponse response = updateBudgetUseCase.execute(userId, month, categoryId, request);

        assertThat(response.categoryId()).isEqualTo(categoryId);
        assertThat(response.plannedAmount()).isEqualTo(newAmount);
        verify(budgetRepository).save(any(BudgetEntity.class));
    }

    @Test
    void shouldThrowNotFoundExceptionWhenCategoryDoesNotExist() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UpdateBudgetRequest request = new UpdateBudgetRequest(new BigDecimal("100.00"));

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateBudgetUseCase.execute(userId, "2026-06", categoryId, request))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void shouldThrowValidationExceptionWhenCategoryBelongsToOtherUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CategoryEntity category = new CategoryEntity(categoryId, otherUserId, "Secret", null, Instant.now(), Instant.now());
        UpdateBudgetRequest request = new UpdateBudgetRequest(new BigDecimal("100.00"));

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> updateBudgetUseCase.execute(userId, "2026-06", categoryId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Category does not belong to the user");
    }
}
