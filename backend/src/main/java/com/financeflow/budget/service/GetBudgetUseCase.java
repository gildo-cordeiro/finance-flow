package com.financeflow.budget.service;

import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.model.domain.Budget;
import com.financeflow.budget.model.mapper.BudgetMapper;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.service.ListCategoriesUseCase;
import com.financeflow.transaction.service.ListTransactionsUseCase;
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
    private final ListCategoriesUseCase listCategoriesUseCase;
    private final ListTransactionsUseCase listTransactionsUseCase;
    private final CoupleRepository coupleRepository;

    public GetBudgetUseCase(
        BudgetRepository budgetRepository,
        ListCategoriesUseCase listCategoriesUseCase,
        ListTransactionsUseCase listTransactionsUseCase,
        CoupleRepository coupleRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.listCategoriesUseCase = listCategoriesUseCase;
        this.listTransactionsUseCase = listTransactionsUseCase;
        this.coupleRepository = coupleRepository;
    }

    public BudgetResponse execute(UUID userId, String month) {
        return execute(userId, "PERSONAL", month);
    }

    public BudgetResponse execute(UUID userId, String viewContext, String month) {
        log.info("Getting budget for user={}, viewContext={}, month={}", userId, viewContext, month);

        if (month == null || !month.matches("^\\d{4}-\\d{2}$")) {
            throw new ValidationException("month", "Month must be in YYYY-MM format");
        }

        UUID partnerId = null;
        if ("COUPLE".equalsIgnoreCase(viewContext)) {
            com.financeflow.couple.model.domain.Couple couple = coupleRepository.findActiveByUserId(userId).orElse(null);
            if (couple != null) {
                partnerId = couple.user1Id().equals(userId) ? couple.user2Id() : couple.user1Id();
            }
        }

        // 1. Fetch all categories
        List<CategoryResponse> categories = listCategoriesUseCase.execute(userId, viewContext);

        // 2. Fetch budgets for the month and map to Domain
        List<Budget> budgets = new ArrayList<>();
        budgets.addAll(budgetRepository.findAllByUserIdAndMonth(userId, month).stream()
            .map(b -> BudgetMapper.toDomain(b))
            .toList());
        if (partnerId != null) {
            budgets.addAll(budgetRepository.findAllByUserIdAndMonth(partnerId, month).stream()
                .map(b -> BudgetMapper.toDomain(b))
                .toList());
        }
        Map<UUID, BigDecimal> plannedAmounts = budgets.stream()
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

        // 4. Calculate realized amounts per category
        List<BudgetItemResponse> items = new ArrayList<>();
        for (CategoryResponse category : categories) {
            BigDecimal planned = plannedAmounts.getOrDefault(category.id(), BigDecimal.ZERO);

            boolean isIncome = isIncomeCategory(category, categories);
            BigDecimal realized = transactions.stream()
                .filter(t -> t.categoryId().equals(category.id()))
                .map(t -> {
                    if (isIncome) {
                        return t.type() == TransactionType.INCOME ? t.amount() : t.amount().negate();
                    } else {
                        return t.type() == TransactionType.EXPENSE ? t.amount() : t.amount().negate();
                    }
                })
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

            // Cap realized at 0 if net is negative (e.g. refund exceeds expenses)
            if (realized.compareTo(BigDecimal.ZERO) < 0) {
                realized = BigDecimal.ZERO;
            }

            items.add(new BudgetItemResponse(
                category.id(),
                category.name(),
                category.parentId(),
                planned,
                realized,
                category.userId()
            ));
        }

        return new BudgetResponse(month, items);
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
