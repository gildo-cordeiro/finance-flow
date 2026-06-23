package com.financeflow.shared.exception;

public class ValidationException extends DomainException {
    public ValidationException(String field, String message) {
        super("VALIDATION_ERROR", "Invalid " + field + ": " + message);
    }
}
