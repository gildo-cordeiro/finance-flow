package com.financeflow.budget.repository.jpa;

import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaBudgetRepository implements BudgetRepository {

    private final SpringBudgetRepository springRepo;

    public JpaBudgetRepository(SpringBudgetRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Optional<BudgetEntity> findByUserIdAndCategoryIdAndMonth(UUID userId, UUID categoryId, String month) {
        return springRepo.findByUserIdAndCategoryIdAndMonth(userId, categoryId, month);
    }

    @Override
    public List<BudgetEntity> findAllByUserIdAndMonth(UUID userId, String month) {
        return springRepo.findAllByUserIdAndMonth(userId, month);
    }

    @Override
    public BudgetEntity save(BudgetEntity budget) {
        return springRepo.save(budget);
    }

    @Override
    public List<BudgetEntity> saveAll(List<BudgetEntity> budgets) {
        return springRepo.saveAll(budgets);
    }
}
