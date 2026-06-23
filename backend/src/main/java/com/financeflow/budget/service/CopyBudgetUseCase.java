package com.financeflow.budget.service;

import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.model.domain.Budget;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.model.mapper.BudgetMapper;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.shared.exception.ValidationException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CopyBudgetUseCase {

    private static final Logger log = LoggerFactory.getLogger(CopyBudgetUseCase.class);

    private final BudgetRepository budgetRepository;
    private final GetBudgetUseCase getBudgetUseCase;

    public CopyBudgetUseCase(
        BudgetRepository budgetRepository,
        GetBudgetUseCase getBudgetUseCase
    ) {
        this.budgetRepository = budgetRepository;
        this.getBudgetUseCase = getBudgetUseCase;
    }

    public BudgetResponse execute(UUID userId, String targetMonth) {
        log.info("Copying budget from previous month to targetMonth={} for user={}", targetMonth, userId);

        if (targetMonth == null || !targetMonth.matches("^\\d{4}-\\d{2}$")) {
            throw new ValidationException("month", "Month must be in YYYY-MM format");
        }

        // Calculate previous month
        String[] parts = targetMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthVal = Integer.parseInt(parts[1]);
        LocalDate targetDate = LocalDate.of(year, monthVal, 1);
        LocalDate previousDate = targetDate.minusMonths(1);
        String previousMonth = String.format("%04d-%02d", previousDate.getYear(), previousDate.getMonthValue());

        // Fetch budgets from previous month and map to Domain
        List<Budget> previousBudgets = budgetRepository.findAllByUserIdAndMonth(userId, previousMonth).stream()
            .map(BudgetMapper::toDomain)
            .toList();

        if (previousBudgets.isEmpty()) {
            log.info("No budgets found in previous month={} to copy for user={}", previousMonth, userId);
            // Return current month's budget as is
            return getBudgetUseCase.execute(userId, targetMonth);
        }

        List<BudgetEntity> budgetsToSave = new ArrayList<>();
        for (Budget prevBudget : previousBudgets) {
            Optional<BudgetEntity> targetBudgetOpt = budgetRepository.findByUserIdAndCategoryIdAndMonth(
                userId, prevBudget.categoryId(), targetMonth
            );

            if (targetBudgetOpt.isPresent()) {
                Budget targetBudgetDomain = BudgetMapper.toDomain(targetBudgetOpt.get());
                Budget updatedTarget = new Budget(
                    targetBudgetDomain.id(),
                    targetBudgetDomain.userId(),
                    targetBudgetDomain.categoryId(),
                    targetBudgetDomain.month(),
                    prevBudget.plannedAmount(),
                    targetBudgetDomain.createdAt(),
                    Instant.now()
                );
                budgetsToSave.add(BudgetMapper.toEntity(updatedTarget));
            } else {
                Budget newBudget = new Budget(
                    UUID.randomUUID(),
                    userId,
                    prevBudget.categoryId(),
                    targetMonth,
                    prevBudget.plannedAmount(),
                    Instant.now(),
                    Instant.now()
                );
                budgetsToSave.add(BudgetMapper.toEntity(newBudget));
            }
        }

        budgetRepository.saveAll(budgetsToSave);
        log.info("Successfully copied {} budgets to month={} for user={}", budgetsToSave.size(), targetMonth, userId);

        return getBudgetUseCase.execute(userId, targetMonth);
    }
}
