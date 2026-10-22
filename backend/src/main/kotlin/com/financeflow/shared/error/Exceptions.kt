package com.financeflow.shared.error

sealed class ApiException(val code: String, message: String) : RuntimeException(message)

class NotFoundException(
    message: String = "Recurso não encontrado",
    code: String = "NOT_FOUND",
) : ApiException(code, message)

class BusinessRuleException(code: String, message: String) : ApiException(code, message)

class ValidationException(
    val fields: List<FieldError>,
    message: String = "Dados inválidos",
    code: String = "VALIDATION_FAILED",
) : ApiException(code, message) {
    constructor(field: String, message: String) : this(listOf(FieldError(field, message)))
}

class ForbiddenException(
    message: String = "Acesso negado",
    code: String = "FORBIDDEN",
) : ApiException(code, message)

data class FieldError(val field: String, val message: String)
