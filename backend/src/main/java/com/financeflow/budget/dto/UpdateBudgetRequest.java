package com.financeflow.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateBudgetRequest(
    @NotNull
    @DecimalMin(value = "0.0", message = "Planned amount cannot be negative")
    BigDecimal plannedAmount
) {}
