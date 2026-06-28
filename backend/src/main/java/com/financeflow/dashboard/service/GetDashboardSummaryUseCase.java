package com.financeflow.dashboard.service;


import com.financeflow.dashboard.dto.DashboardSummaryResponse;
import com.financeflow.dashboard.dto.MemberBreakdown;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.service.ListCategoriesUseCase;
import com.financeflow.transaction.service.ListTransactionsUseCase;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.service.GetBudgetUseCase;

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

    private final ListCategoriesUseCase listCategoriesUseCase;
    private final ListTransactionsUseCase listTransactionsUseCase;
    private final GetBudgetUseCase getBudgetUseCase;

    public GetDashboardSummaryUseCase(
        ListCategoriesUseCase listCategoriesUseCase,
        ListTransactionsUseCase listTransactionsUseCase,
        GetBudgetUseCase getBudgetUseCase
    ) {
        this.listCategoriesUseCase = listCategoriesUseCase;
        this.listTransactionsUseCase = listTransactionsUseCase;
        this.getBudgetUseCase = getBudgetUseCase;
    }

    public DashboardSummaryResponse execute(UUID userId, String month) {
        return execute(userId, "PERSONAL", month);
    }

    public DashboardSummaryResponse execute(UUID userId, String viewContext, String month) {
        log.info("Getting dashboard summary for user={}, viewContext={}, month={}", userId, viewContext, month);

        if (month == null || month.isBlank()) {
            month = LocalDate.now().toString().substring(0, 7);
        }

        if (!month.matches("^\\d{4}-\\d{2}$")) {
            throw new ValidationException("month", "Month must be in YYYY-MM format");
        }

        // 1. Fetch categories
        List<CategoryResponse> categories = listCategoriesUseCase.execute(userId, viewContext);

        // 2. Fetch budgets for the month
        BudgetResponse budgetResponse = getBudgetUseCase.execute(userId, month);
        Map<UUID, BigDecimal> plannedAmounts = budgetResponse.items().stream()
            .collect(Collectors.toMap(b -> b.categoryId(), b -> b.plannedAmount(), (a, b) -> a));

        // 3. Fetch transactions for the month based on competenceDate
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int monthVal = Integer.parseInt(parts[1]);
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<TransactionResponse> transactions = listTransactionsUseCase.execute(
            userId, viewContext, startDate, endDate, null, null
        );

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

        for (CategoryResponse category : categories) {
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

        // 6. Compute per-member breakdown for COUPLE context
        MemberBreakdown memberBreakdown = null;
        if ("COUPLE".equalsIgnoreCase(viewContext)) {
            BigDecimal userRevenue = transactions.stream()
                .filter(t -> t.type() == TransactionType.INCOME && t.userId().equals(userId))
                .map(TransactionResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal userExpenses = transactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE && t.userId().equals(userId))
                .map(TransactionResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal partnerRevenue = totalRevenue.subtract(userRevenue);
            BigDecimal partnerExpenses = totalExpenses.subtract(userExpenses);

            memberBreakdown = new MemberBreakdown(userRevenue, userExpenses, partnerRevenue, partnerExpenses);
        }

        return new DashboardSummaryResponse(
            totalRevenue,
            totalExpenses,
            balance,
            budgetPlanned,
            budgetRealized,
            memberBreakdown
        );
    }

    private boolean isIncomeCategory(CategoryResponse category, List<CategoryResponse> allCategories) {
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
