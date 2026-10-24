package com.financeflow.auth.application

import com.financeflow.auth.domain.PasswordPolicy
import com.financeflow.auth.infra.AuthProperties
import com.financeflow.auth.infra.PasswordResetTokenEntity
import com.financeflow.auth.infra.PasswordResetTokenRepository
import com.financeflow.auth.infra.UserRepository
import com.financeflow.shared.email.EmailMessage
import com.financeflow.shared.email.EmailSender
import com.financeflow.shared.error.FieldError
import com.financeflow.shared.error.ValidationException
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.util.UUID

/** Recuperação de senha por link de uso único enviado por e-mail (RF-004). */
@Service
class PasswordResetService(
    private val users: UserRepository,
    private val repository: PasswordResetTokenRepository,
    private val sessions: SessionService,
    private val passwordEncoder: PasswordEncoder,
    private val emailSender: EmailSender,
    private val properties: AuthProperties,
    private val clock: Clock,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    /** Envia o link se o e-mail estiver cadastrado; caso contrário, não faz nada, sem revelar isso a quem pediu. */
    @Transactional
    fun requestReset(email: String) {
        val user = users.findByEmail(email.trim().lowercase()) ?: return
        repository.deleteUnusedByUserId(user.id)

        val token = OpaqueToken.generate()
        repository.save(
            PasswordResetTokenEntity(
                id = UUID.randomUUID(),
                userId = user.id,
                tokenHash = OpaqueToken.hash(token),
                expiresAt = clock.instant().plus(properties.passwordResetTtl),
            ),
        )
        val link = "${properties.frontendUrl.trimEnd('/')}/redefinir-senha?token=$token"
        // Uma falha do provedor não pode virar 500 só para e-mails cadastrados
        try {
            emailSender.send(resetEmail(user.email, user.name, link))
        } catch (ex: Exception) {
            log.error("Falha ao enviar o e-mail de redefinição de senha do usuário {}", user.id, ex)
        }
    }

    /** Troca a senha e revoga todas as sessões abertas (ADR-0005). */
    @Transactional
    fun reset(token: String, newPassword: String) {
        val current = repository.findByTokenHash(OpaqueToken.hash(token))
        val now = clock.instant()
        if (current == null || current.usedAt != null || !current.expiresAt.isAfter(now)) throw invalidResetToken()
        PasswordPolicy.violation(newPassword)?.let { throw ValidationException("newPassword", it) }

        val user = users.findById(current.userId).orElseThrow()
        user.passwordHash = passwordEncoder.encode(newPassword)!!
        current.usedAt = now
        sessions.revokeAll(user.id)
    }

    /** Apaga, uma vez por dia, os links expirados há mais de 30 dias. */
    @Scheduled(cron = "\${app.auth.password-reset-cleanup-cron:0 40 3 * * *}")
    @Transactional
    fun deleteExpired(): Int {
        val deleted = repository.deleteExpiredBefore(clock.instant().minus(RETENTION_AFTER_EXPIRY))
        log.info("Links de redefinição de senha expirados apagados: {}", deleted)
        return deleted
    }

    private fun resetEmail(to: String, name: String, link: String): EmailMessage {
        val minutes = properties.passwordResetTtl.toMinutes()
        val body = """
            |Olá, $name.
            |
            |Recebemos um pedido para redefinir a senha da sua conta no FinanceFlow. Para criar uma senha nova, abra o link abaixo:
            |
            |$link
            |
            |O link vale por $minutes minutos e só pode ser usado uma vez. Ao redefinir a senha, todas as sessões abertas são encerradas.
            |
            |Se não foi você quem pediu, ignore este e-mail: sua senha continua a mesma.
        """.trimMargin()
        return EmailMessage(to, "Redefinição de senha do FinanceFlow", body)
    }

    private fun invalidResetToken() = ValidationException(
        fields = listOf(FieldError("token", "Link inválido ou expirado")),
        message = "Link de redefinição inválido, expirado ou já usado",
        code = "INVALID_RESET_TOKEN",
    )

    companion object {
        private val RETENTION_AFTER_EXPIRY = Duration.ofDays(30)
    }
}
