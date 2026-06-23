package com.financeflow.budget.repository;

import com.financeflow.budget.model.entity.BudgetEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository {
    Optional<BudgetEntity> findByUserIdAndCategoryIdAndMonth(UUID userId, UUID categoryId, String month);
    List<BudgetEntity> findAllByUserIdAndMonth(UUID userId, String month);
    BudgetEntity save(BudgetEntity budget);
    List<BudgetEntity> saveAll(List<BudgetEntity> budgets);
}
