package com.financeflow.auth.domain

/**
 * Política de senha provisória (RF-001), até a decisão pendente "Política de senha":
 * mínimo de 8 caracteres, ao menos uma letra e um número, no máximo 72 bytes (limite do bcrypt).
 */
object PasswordPolicy {

    const val MIN_LENGTH = 8
    const val MAX_BYTES = 72

    /** Devolve a mensagem da regra violada, ou `null` se a senha é aceita. */
    fun violation(password: String): String? = when {
        password.length < MIN_LENGTH -> "A senha precisa ter ao menos $MIN_LENGTH caracteres"
        exceedsMaxBytes(password) -> "A senha pode ter no máximo $MAX_BYTES bytes"
        password.none { it.isLetter() } -> "A senha precisa ter ao menos uma letra"
        password.none { it.isDigit() } -> "A senha precisa ter ao menos um número"
        else -> null
    }

    fun exceedsMaxBytes(password: String): Boolean = password.toByteArray(Charsets.UTF_8).size > MAX_BYTES
}
