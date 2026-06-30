package com.financeflow.auth.dto;

import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String name,
    String timeZone,
    String currency,
    int budgetClosingDay,
    String dateFormat
) {
    public UserResponse(UUID id, String email, String name, String timeZone, String currency, int budgetClosingDay) {
        this(id, email, name, timeZone, currency, budgetClosingDay, "dd/MM/yyyy");
    }
}
