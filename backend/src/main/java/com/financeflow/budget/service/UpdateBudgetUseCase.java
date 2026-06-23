package com.financeflow.budget.service;

import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.UpdateBudgetRequest;
import com.financeflow.budget.model.entity.BudgetEntity;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UpdateBudgetUseCase {

    private static final Logger log = LoggerFactory.getLogger(UpdateBudgetUseCase.class);

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public UpdateBudgetUseCase(
        BudgetRepository budgetRepository,
        CategoryRepository categoryRepository,
        TransactionRepository transactionRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public BudgetItemResponse execute(UUID userId, String month, UUID categoryId, UpdateBudgetRequest request) {
        log.info("Updating planned amount for user={}, month={}, categoryId={}, amount={}",
            userId, month, categoryId, request.plannedAmount());

        if (month == null || !month.matches("^\\d{4}-\\d{2}$")) {
            throw new ValidationException("month", "Month must be in YYYY-MM format");
        }

        // Validate category exists and belongs to the user or is system-wide
        CategoryEntity category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Category", categoryId));

        if (category.getUserId() != null && !category.getUserId().equals(userId)) {
            throw new ValidationException("categoryId", "Category does not belong to the user");
        }

        // Find or create budget
        BudgetEntity budget = budgetRepository.findByUserIdAndCategoryIdAndMonth(userId, categoryId, month)
            .orElseGet(() -> new BudgetEntity(
                UUID.randomUUID(),
                userId,
                categoryId,
                month,
                request.plannedAmount(),
                Instant.now(),
                Instant.now()
            ));

        budget.setPlannedAmount(request.plannedAmount());
        budget.setUpdatedAt(Instant.now());

        BudgetEntity saved = budgetRepository.save(budget);

        // Fetch transactions for the month for this category to compute realized amount
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthVal = Integer.parseInt(parts[1]);
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<TransactionEntity> transactions = transactionRepository.findAllFiltered(
            userId, startDate, endDate, categoryId, null
        );

        List<CategoryEntity> allCategories = categoryRepository.findAllByUserId(userId);
        boolean isIncome = isIncomeCategory(category, allCategories);
        BigDecimal realized = transactions.stream()
            .map(t -> {
                if (isIncome) {
                    return t.getType() == TransactionType.INCOME ? t.getAmount() : t.getAmount().negate();
                } else {
                    return t.getType() == TransactionType.EXPENSE ? t.getAmount() : t.getAmount().negate();
                }
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (realized.compareTo(BigDecimal.ZERO) < 0) {
            realized = BigDecimal.ZERO;
        }

        return new BudgetItemResponse(
            category.getId(),
            category.getName(),
            category.getParentId(),
            saved.getPlannedAmount(),
            realized
        );
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
