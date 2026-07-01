package com.financeflow.goals.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateGoalRequest(
    @NotBlank(message = "Name cannot be blank") String name,
    String description,
    @NotNull(message = "Target amount cannot be null")
    @DecimalMin(value = "0.01", message = "Target amount must be greater than zero")
    BigDecimal targetAmount,
    @NotNull(message = "Deadline cannot be null") LocalDate deadline
) {}
