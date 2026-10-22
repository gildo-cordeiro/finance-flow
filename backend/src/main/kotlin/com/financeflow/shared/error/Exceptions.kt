package com.financeflow.shared.error

/**
 * Exceções de domínio traduzidas em Problem Details pelo [GlobalExceptionHandler] (ADR-0027).
 * Não dependem de Spring, então podem ser lançadas da camada `domain` (ADR-0028).
 *
 * `code` é estável e é o que o frontend usa para escolher a mensagem.
 */
sealed class ApiException(val code: String, message: String) : RuntimeException(message)

/**
 * 404. Também é a resposta para recurso de outro usuário: não revelar que ele existe (ADR-0012).
 */
class NotFoundException(
    message: String = "Recurso não encontrado",
    code: String = "NOT_FOUND",
) : ApiException(code, message)

/** 409: a requisição é válida, mas fere uma regra de negócio (ex.: `CATEGORY_IN_USE`). */
class BusinessRuleException(code: String, message: String) : ApiException(code, message)

/** 422: um ou mais campos têm valores inválidos. */
class ValidationException(
    val fields: List<FieldError>,
    message: String = "Dados inválidos",
    code: String = "VALIDATION_FAILED",
) : ApiException(code, message) {
    constructor(field: String, message: String) : this(listOf(FieldError(field, message)))
}

/** 403: autenticado, mas sem permissão para a ação (não usar para isolamento entre usuários). */
class ForbiddenException(
    message: String = "Acesso negado",
    code: String = "FORBIDDEN",
) : ApiException(code, message)

data class FieldError(val field: String, val message: String)
