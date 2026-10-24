package com.financeflow.shared.error

/**
 * Erro de regra de negócio que um endpoint pode responder, para a documentação da API (ADR-0033).
 * 401, 404, 400 e 422 de validação entram sozinhos, pela forma do endpoint (`OpenApiConfig`).
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@Repeatable
annotation class DocumentedError(val status: Int, val code: String, val description: String)
