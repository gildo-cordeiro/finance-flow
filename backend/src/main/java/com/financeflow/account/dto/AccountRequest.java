package com.financeflow.account.dto;

import com.financeflow.account.model.domain.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AccountRequest(
    @NotBlank String name,
    @NotNull AccountType type,
    @NotBlank String bank,
    @NotNull BigDecimal balance,
    BigDecimal creditLimit,
    Integer closingDay,
    Integer dueDay
) {}
