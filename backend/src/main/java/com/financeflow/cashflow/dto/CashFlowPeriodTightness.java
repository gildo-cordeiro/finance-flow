package com.financeflow.cashflow.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CashFlowPeriodTightness(
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal minimumBalance
) {}
