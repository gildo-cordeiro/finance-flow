package com.financeflow.shared.exception;

public class BusinessException extends DomainException {
    public BusinessException(String code, String message) {
        super(code, message);
    }
}
