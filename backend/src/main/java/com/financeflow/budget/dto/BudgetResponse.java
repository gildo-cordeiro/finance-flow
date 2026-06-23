package com.financeflow.budget.dto;

import java.util.List;

public record BudgetResponse(
    String month,
    List<BudgetItemResponse> items
) {}
