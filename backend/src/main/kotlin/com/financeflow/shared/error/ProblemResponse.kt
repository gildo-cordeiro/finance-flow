package com.financeflow.shared.error

/**
 * Documenta no OpenAPI uma resposta de erro do endpoint e os `code` que ela pode trazer (ADR-0027, ADR-0033).
 * O 401 das rotas autenticadas é acrescentado sozinho.
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@Repeatable
annotation class ProblemResponse(val status: Int, vararg val codes: String)
