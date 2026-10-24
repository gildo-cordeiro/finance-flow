package com.financeflow.auth.domain

/** E-mail é guardado e comparado sem espaços e em minúsculas, inclusive nas chaves de rate limit. */
object EmailAddress {

    private val FORMAT = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")

    fun normalize(email: String): String = email.trim().lowercase()

    /** Espera um e-mail já passado por [normalize]. */
    fun isValid(normalized: String): Boolean = FORMAT.matches(normalized)
}
