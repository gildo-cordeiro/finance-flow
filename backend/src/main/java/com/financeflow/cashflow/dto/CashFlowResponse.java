package com.financeflow.cashflow.dto;

import java.util.List;

public record CashFlowResponse(
    List<CashFlowDailyPoint> dailyPoints,
    List<CashFlowPeriodTightness> tightnessPeriods
) {}
