package com.financeflow.auth.application

import com.financeflow.auth.infra.AuthProperties
import com.financeflow.auth.infra.RefreshTokenEntity
import com.financeflow.auth.infra.RefreshTokenRepository
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Clock
import java.util.Base64
import java.util.HexFormat
import java.util.UUID

@Component
class RefreshTokens(
    private val repository: RefreshTokenRepository,
    private val properties: AuthProperties,
    private val clock: Clock,
) {

    private val random = SecureRandom()

    /** Cria um refresh token opaco para o usuário e devolve o valor puro, que só vai para o cookie. */
    fun create(userId: UUID): String {
        val bytes = ByteArray(TOKEN_BYTES).also(random::nextBytes)
        val token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        repository.save(
            RefreshTokenEntity(
                id = UUID.randomUUID(),
                userId = userId,
                tokenHash = hash(token),
                expiresAt = clock.instant().plus(properties.refreshTokenTtl),
            ),
        )
        return token
    }

    companion object {
        private const val TOKEN_BYTES = 32

        fun hash(token: String): String =
            HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.toByteArray(Charsets.UTF_8)))
    }
}
