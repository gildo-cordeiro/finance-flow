package com.financeflow.auth.application

import java.util.UUID

data class AccessToken(val value: String, val expiresInSeconds: Long)

/** Emite o access token da sessão (ADR-0005). A implementação com JWT fica em `infra`. */
interface TokenIssuer {

    fun issue(userId: UUID): AccessToken
}
