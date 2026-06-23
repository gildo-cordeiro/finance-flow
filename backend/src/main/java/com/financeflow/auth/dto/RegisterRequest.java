package com.financeflow.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password,

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
