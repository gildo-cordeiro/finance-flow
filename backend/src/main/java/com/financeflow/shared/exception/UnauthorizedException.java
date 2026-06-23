package com.financeflow.shared.exception;

public class UnauthorizedException extends DomainException {
    public UnauthorizedException(String message) {
        super("UNAUTHORIZED", message);
    }
}
