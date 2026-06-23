package com.financeflow.budget.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetItemResponse(
    UUID categoryId,
    String categoryName,
    UUID parentCategoryId,
    BigDecimal plannedAmount,
    BigDecimal realizedAmount
) {}
