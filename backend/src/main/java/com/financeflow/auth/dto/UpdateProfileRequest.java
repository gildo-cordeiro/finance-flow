package com.financeflow.auth.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateProfileRequest(
    @NotBlank(message = "Name is required")
    String name,

    @NotBlank(message = "Time zone is required")
    String timeZone,

    @NotBlank(message = "Currency is required")
    String currency,

    @NotNull(message = "Budget closing day is required")
    @Min(value = 1, message = "Budget closing day must be at least 1")
    @Max(value = 31, message = "Budget closing day must be at most 31")
    Integer budgetClosingDay
) {}
