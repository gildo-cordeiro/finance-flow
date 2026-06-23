package com.financeflow.budget.model.mapper;

import com.financeflow.budget.model.domain.Budget;
import com.financeflow.budget.model.entity.BudgetEntity;

public final class BudgetMapper {

    private BudgetMapper() {
        // utility class
    }

    public static Budget toDomain(BudgetEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Budget(
            entity.getId(),
            entity.getUserId(),
            entity.getCategoryId(),
            entity.getMonth(),
            entity.getPlannedAmount(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static BudgetEntity toEntity(Budget domain) {
        if (domain == null) {
            return null;
        }
        return new BudgetEntity(
            domain.id(),
            domain.userId(),
            domain.categoryId(),
            domain.month(),
            domain.plannedAmount(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }
}
