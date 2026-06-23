package com.financeflow.dashboard.service;

import com.financeflow.dashboard.dto.DashboardSummaryResponse;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.Category;
import com.financeflow.transaction.model.domain.Transaction;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.mapper.CategoryMapper;
import com.financeflow.transaction.model.mapper.TransactionMapper;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import com.financeflow.budget.model.domain.Budget;
import com.financeflow.budget.model.mapper.BudgetMapper;
import com.financeflow.budget.repository.BudgetRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
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
public class GetDashboardSummaryUseCase {

    private static final Logger log = LoggerFactory.getLogger(GetDashboardSummaryUseCase.class);

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public GetDashboardSummaryUseCase(
        CategoryRepository categoryRepository,
        TransactionRepository transactionRepository,
        BudgetRepository budgetRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    public DashboardSummaryResponse execute(UUID userId, String month) {
        log.info("Getting dashboard summary for user={}, month={}", userId, month);

        if (month == null || month.isBlank()) {
            month = LocalDate.now().toString().substring(0, 7);
        }

        if (!month.matches("^\\d{4}-\\d{2}$")) {
            throw new ValidationException("month", "Month must be in YYYY-MM format");
        }

        // 1. Fetch categories and map to Domain
        List<Category> categories = categoryRepository.findAllByUserId(userId).stream()
            .map(c -> CategoryMapper.toDomain(c))
            .toList();

        // 2. Fetch budgets for the month and map to Domain
        List<Budget> budgets = budgetRepository.findAllByUserIdAndMonth(userId, month).stream()
            .map(b -> BudgetMapper.toDomain(b))
            .toList();
        Map<UUID, BigDecimal> plannedAmounts = budgets.stream()
            .collect(Collectors.toMap(b -> b.categoryId(), b -> b.plannedAmount(), (a, b) -> a));

        // 3. Fetch transactions for the month based on competenceDate and map to Domain
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthVal = Integer.parseInt(parts[1]);
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<Transaction> transactions = transactionRepository.findAllFiltered(
            userId, startDate, endDate, null, null
        ).stream()
            .map(t -> TransactionMapper.toDomain(t))
            .toList();

        // 4. Calculate total revenue and total expenses
        BigDecimal totalRevenue = transactions.stream()
            .filter(t -> t.type() == TransactionType.INCOME)
            .map(t -> t.amount())
            .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        BigDecimal totalExpenses = transactions.stream()
            .filter(t -> t.type() == TransactionType.EXPENSE)
            .map(t -> t.amount())
            .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        BigDecimal balance = totalRevenue.subtract(totalExpenses);

        // 5. Calculate budget progress for expense categories
        BigDecimal budgetPlanned = BigDecimal.ZERO;
        BigDecimal budgetRealized = BigDecimal.ZERO;

        for (Category category : categories) {
            boolean isIncome = isIncomeCategory(category, categories);
            if (!isIncome) {
                // Sum planned
                BigDecimal planned = plannedAmounts.getOrDefault(category.id(), BigDecimal.ZERO);
                budgetPlanned = budgetPlanned.add(planned);

                // Sum realized
                BigDecimal realized = transactions.stream()
                    .filter(t -> t.categoryId().equals(category.id()))
                    .map(t -> t.type() == TransactionType.EXPENSE ? t.amount() : t.amount().negate())
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

                if (realized.compareTo(BigDecimal.ZERO) < 0) {
                    realized = BigDecimal.ZERO;
                }
                budgetRealized = budgetRealized.add(realized);
            }
        }

        return new DashboardSummaryResponse(
            totalRevenue,
            totalExpenses,
            balance,
            budgetPlanned,
            budgetRealized
        );
    }

    private boolean isIncomeCategory(Category category, List<Category> allCategories) {
        if (category.id().toString().equals("a1b1c1d1-0000-0000-0000-000000000001")
            || "Receitas".equalsIgnoreCase(category.name())) {
            return true;
        }
        if (category.parentId() != null) {
            return allCategories.stream()
                .filter(c -> c.id().equals(category.parentId()))
                .findFirst()
                .map(parent -> isIncomeCategory(parent, allCategories))
                .orElse(false);
        }
        return false;
    }
}
