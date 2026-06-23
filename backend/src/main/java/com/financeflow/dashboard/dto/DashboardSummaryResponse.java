package com.financeflow.dashboard.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
    BigDecimal totalRevenue,
    BigDecimal totalExpenses,
    BigDecimal balance,
    BigDecimal budgetPlanned,
    BigDecimal budgetRealized
) {}
