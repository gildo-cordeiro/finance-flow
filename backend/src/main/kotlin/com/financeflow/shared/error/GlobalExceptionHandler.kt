package com.financeflow.shared.error

import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import org.springframework.web.method.annotation.HandlerMethodValidationException
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

@RestControllerAdvice
class GlobalExceptionHandler : ResponseEntityExceptionHandler() {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException): ResponseEntity<ProblemDetail> {
        val status = when (ex) {
            is NotFoundException -> HttpStatus.NOT_FOUND
            is BusinessRuleException -> HttpStatus.CONFLICT
            is ValidationException -> HttpStatus.UNPROCESSABLE_CONTENT
            is ForbiddenException -> HttpStatus.FORBIDDEN
        }
        val fields = (ex as? ValidationException)?.fields
        return problem(status, ex.code, ex.message, fields)
    }

    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthentication(ex: AuthenticationException): ResponseEntity<ProblemDetail> =
        problem(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Autenticação necessária")

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException): ResponseEntity<ProblemDetail> =
        problem(HttpStatus.FORBIDDEN, "FORBIDDEN", "Acesso negado")

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(ex: Exception): ResponseEntity<ProblemDetail> {
        log.error("Erro inesperado", ex)
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Erro inesperado")
    }

    override fun handleMethodArgumentNotValid(
        ex: MethodArgumentNotValidException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest,
    ): ResponseEntity<Any> {
        val fields = ex.bindingResult.fieldErrors.map { FieldError(it.field, it.defaultMessage ?: "inválido") } +
            ex.bindingResult.globalErrors.map { FieldError(it.objectName, it.defaultMessage ?: "inválido") }
        return validationFailed(fields)
    }

    override fun handleHandlerMethodValidationException(
        ex: HandlerMethodValidationException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest,
    ): ResponseEntity<Any> {
        val fields = ex.parameterValidationResults.flatMap { result ->
            val name = result.methodParameter.parameterName ?: "param${result.methodParameter.parameterIndex}"
            result.resolvableErrors.map { FieldError(name, it.defaultMessage ?: "inválido") }
        }
        return validationFailed(fields)
    }

    override fun handleHttpMessageNotReadable(
        ex: HttpMessageNotReadableException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest,
    ): ResponseEntity<Any> =
        problem(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "Corpo da requisição inválido ou malformado").widen()

    override fun createResponseEntity(
        body: Any?,
        headers: HttpHeaders,
        statusCode: HttpStatusCode,
        request: WebRequest,
    ): ResponseEntity<Any> {
        if (body is ProblemDetail && body.properties?.containsKey("code") != true) {
            body.setProperty("code", codeFor(statusCode))
        }
        return super.createResponseEntity(body, headers, statusCode, request)
    }

    private fun validationFailed(fields: List<FieldError>): ResponseEntity<Any> =
        problem(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_FAILED", "Dados inválidos", fields).widen()

    private fun problem(
        status: HttpStatus,
        code: String,
        detail: String?,
        fields: List<FieldError>? = null,
    ): ResponseEntity<ProblemDetail> {
        val body = ProblemDetail.forStatusAndDetail(status, detail).apply {
            title = status.reasonPhrase
            setProperty("code", code)
            if (fields != null) setProperty("errors", fields)
        }
        return ResponseEntity.status(status).body(body)
    }

    private fun codeFor(status: HttpStatusCode): String =
        HttpStatus.resolve(status.value())?.name ?: "HTTP_${status.value()}"

    @Suppress("UNCHECKED_CAST")
    private fun ResponseEntity<ProblemDetail>.widen(): ResponseEntity<Any> = this as ResponseEntity<Any>
}
