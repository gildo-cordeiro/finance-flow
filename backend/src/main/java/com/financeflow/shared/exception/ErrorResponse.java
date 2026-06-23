package com.financeflow.shared.exception;

import java.util.List;

public record ErrorResponse(String code, String message, List<FieldError> errors) {
    public ErrorResponse(String code, String message) {
        this(code, message, List.of());
    }

    public record FieldError(String field, String message) {}
}
