package com.financeflow.budget.repository.jpa;

import com.financeflow.budget.model.entity.BudgetEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringBudgetRepository extends JpaRepository<BudgetEntity, UUID> {
    Optional<BudgetEntity> findByUserIdAndCategoryIdAndMonth(UUID userId, UUID categoryId, String month);
    List<BudgetEntity> findAllByUserIdAndMonth(UUID userId, String month);
}
