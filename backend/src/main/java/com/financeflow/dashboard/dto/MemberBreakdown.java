package com.financeflow.dashboard.dto;

import java.math.BigDecimal;

public record MemberBreakdown(
    BigDecimal userRevenue,
    BigDecimal userExpenses,
    BigDecimal partnerRevenue,
    BigDecimal partnerExpenses
) {}
