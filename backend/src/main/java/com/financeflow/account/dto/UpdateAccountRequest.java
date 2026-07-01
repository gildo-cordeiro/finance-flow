package com.financeflow.account.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record UpdateAccountRequest(
    @NotBlank String name,
    @NotBlank String bank,
    BigDecimal balance,
    BigDecimal creditLimit,
    Integer closingDay,
    Integer dueDay
) {}
