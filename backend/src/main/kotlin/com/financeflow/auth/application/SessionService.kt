package com.financeflow.auth.application

import com.financeflow.auth.infra.RefreshTokenEntity
import com.financeflow.auth.infra.RefreshTokenRepository
import com.financeflow.shared.error.UnauthorizedException
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.util.UUID

data class RotatedSession(val userId: UUID, val refreshToken: String)

/** Sessões do usuário, representadas pelos refresh tokens (ADR-0005). */
@Service
class SessionService(
    private val repository: RefreshTokenRepository,
    private val properties: AuthProperties,
    private val clock: Clock,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    /** Abre uma sessão e devolve o valor puro do refresh token, que só vai para o cookie. */
    @Transactional
    fun create(userId: UUID): String = save(userId).second

    /**
     * Troca o refresh token por um novo. Apresentar um token que já foi rotacionado indica roubo:
     * todas as sessões do usuário são revogadas, e a revogação fica gravada apesar do 401.
     */
    @Transactional(noRollbackFor = [UnauthorizedException::class])
    fun rotate(refreshToken: String): RotatedSession {
        val current = repository.findByTokenHash(OpaqueToken.hash(refreshToken)) ?: throw invalidRefreshToken()
        val now = clock.instant()
        if (current.replacedBy != null) {
            log.warn("Refresh token reutilizado; revogando todas as sessões do usuário {}", current.userId)
            repository.revokeAllByUserId(current.userId, now)
            throw invalidRefreshToken()
        }
        if (current.revokedAt != null || !current.expiresAt.isAfter(now)) throw invalidRefreshToken()

        val (next, token) = save(current.userId)
        current.revokedAt = now
        current.replacedBy = next.id
        return RotatedSession(current.userId, token)
    }

    /** Encerra a sessão do token, se ela existir e estiver ativa. */
    @Transactional
    fun revoke(refreshToken: String) {
        val current = repository.findByTokenHash(OpaqueToken.hash(refreshToken)) ?: return
        if (current.revokedAt == null) current.revokedAt = clock.instant()
    }

    /** Encerra todas as sessões do usuário (troca de senha, reuso de token). */
    @Transactional
    fun revokeAll(userId: UUID) {
        repository.revokeAllByUserId(userId, clock.instant())
    }

    /** Apaga, uma vez por dia, os refresh tokens expirados há mais de 30 dias. */
    @Scheduled(cron = "\${app.auth.session-cleanup-cron:0 30 3 * * *}")
    @Transactional
    fun deleteExpired(): Int {
        val deleted = repository.deleteExpiredBefore(clock.instant().minus(RETENTION_AFTER_EXPIRY))
        log.info("Refresh tokens expirados apagados: {}", deleted)
        return deleted
    }

    private fun save(userId: UUID): Pair<RefreshTokenEntity, String> {
        val token = OpaqueToken.generate()
        val entity = repository.save(
            RefreshTokenEntity(
                id = UUID.randomUUID(),
                userId = userId,
                tokenHash = OpaqueToken.hash(token),
                expiresAt = clock.instant().plus(properties.refreshTokenTtl),
            ),
        )
        return entity to token
    }

    private fun invalidRefreshToken() = UnauthorizedException("Sessão inválida ou expirada", "INVALID_REFRESH_TOKEN")

    companion object {
        private val RETENTION_AFTER_EXPIRY = Duration.ofDays(30)
    }
}
