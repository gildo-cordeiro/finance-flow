package com.financeflow.account.dto;

import com.financeflow.account.model.domain.AccountType;
import java.math.BigDecimal;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    UUID userId,
    String name,
    AccountType type,
    String bank,
    BigDecimal balance,
    BigDecimal creditLimit,
    Integer closingDay,
    Integer dueDay,
    UUID associatedAccountId
) {}
