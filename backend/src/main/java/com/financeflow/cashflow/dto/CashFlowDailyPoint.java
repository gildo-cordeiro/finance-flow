package com.financeflow.cashflow.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record CashFlowDailyPoint(
    LocalDate date,
    BigDecimal consolidatedBalance,
    BigDecimal income,
    BigDecimal expense,
    Map<UUID, AccountBalanceInfo> accountBalances
) {}
