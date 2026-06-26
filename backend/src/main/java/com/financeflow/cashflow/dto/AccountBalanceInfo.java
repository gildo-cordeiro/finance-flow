package com.financeflow.cashflow.dto;

import java.math.BigDecimal;

public record AccountBalanceInfo(
    String name,
    BigDecimal balance
) {}
