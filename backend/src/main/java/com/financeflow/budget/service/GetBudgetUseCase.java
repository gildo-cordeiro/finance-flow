package com.financeflow.budget.service;

import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GetBudgetUseCase {

    private static final Logger log = LoggerFactory.getLogger(GetBudgetUseCase.class);

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public GetBudgetUseCase(
        BudgetRepository budgetRepository,
        CategoryRepository categoryRepository,
        TransactionRepository transactionRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public BudgetResponse execute(UUID userId, String month) {
        log.info("Getting budget for user={}, month={}", userId, month);

        if (month == null || !month.matches("^\\d{4}-\\d{2}$")) {
            throw new ValidationException("month", "Month must be in YYYY-MM format");
        }

        // 1. Fetch all categories
        List<CategoryEntity> categories = categoryRepository.findAllByUserId(userId);

        // 2. Fetch budgets for the month
        List<BudgetEntity> budgets = budgetRepository.findAllByUserIdAndMonth(userId, month);
        Map<UUID, BigDecimal> plannedAmounts = budgets.stream()
            .collect(Collectors.toMap(BudgetEntity::getCategoryId, BudgetEntity::getPlannedAmount));

        // 3. Fetch transactions for the month based on competenceDate
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthVal = Integer.parseInt(parts[1]);
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<TransactionEntity> transactions = transactionRepository.findAllFiltered(
            userId, startDate, endDate, null, null
        );

        // 4. Calculate realized amounts per category
        List<BudgetItemResponse> items = new ArrayList<>();
        for (CategoryEntity category : categories) {
            BigDecimal planned = plannedAmounts.getOrDefault(category.getId(), BigDecimal.ZERO);

            boolean isIncome = isIncomeCategory(category, categories);
            BigDecimal realized = transactions.stream()
                .filter(t -> t.getCategoryId().equals(category.getId()))
                .map(t -> {
                    if (isIncome) {
                        return t.getType() == TransactionType.INCOME ? t.getAmount() : t.getAmount().negate();
                    } else {
                        return t.getType() == TransactionType.EXPENSE ? t.getAmount() : t.getAmount().negate();
                    }
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Cap realized at 0 if net is negative (e.g. refund exceeds expenses)
            if (realized.compareTo(BigDecimal.ZERO) < 0) {
                realized = BigDecimal.ZERO;
            }

            items.add(new BudgetItemResponse(
                category.getId(),
                category.getName(),
                category.getParentId(),
                planned,
                realized
            ));
        }

        return new BudgetResponse(month, items);
    }

    private boolean isIncomeCategory(CategoryEntity category, List<CategoryEntity> allCategories) {
        if (category.getId().toString().equals("a1b1c1d1-0000-0000-0000-000000000001")
            || "Receitas".equalsIgnoreCase(category.getName())) {
            return true;
        }
        if (category.getParentId() != null) {
            return allCategories.stream()
                .filter(c -> c.getId().equals(category.getParentId()))
                .findFirst()
                .map(parent -> isIncomeCategory(parent, allCategories))
                .orElse(false);
        }
        return false;
    }
}
