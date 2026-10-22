package com.financeflow.auth.application

import com.financeflow.auth.domain.PasswordPolicy
import com.financeflow.auth.domain.UserRegistered
import com.financeflow.auth.infra.AccessToken
import com.financeflow.auth.infra.AccessTokenIssuer
import com.financeflow.auth.infra.AuthProperties
import com.financeflow.auth.infra.UserEntity
import com.financeflow.auth.infra.UserRepository
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.UnauthorizedException
import com.financeflow.shared.error.ValidationException
import org.springframework.context.ApplicationEventPublisher
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.UUID

data class RegisterCommand(
    val name: String,
    val email: String,
    val password: String,
    val acceptedPrivacyVersion: String,
)

data class AuthResult(val accessToken: AccessToken, val refreshToken: String, val user: UserEntity)

@Service
class AuthService(
    private val users: UserRepository,
    private val refreshTokens: RefreshTokens,
    private val accessTokens: AccessTokenIssuer,
    private val passwordEncoder: PasswordEncoder,
    private val events: ApplicationEventPublisher,
    private val properties: AuthProperties,
    private val clock: Clock,
) {

    // Compara com um hash qualquer quando o e-mail não existe, para o tempo de resposta não revelar isso (RF-002)
    private val dummyHash: String = passwordEncoder.encode("senha-de-comparacao-1")!!

    @Transactional
    fun register(command: RegisterCommand): AuthResult {
        if (command.acceptedPrivacyVersion != properties.privacyVersion) {
            throw ValidationException("acceptedPrivacyVersion", "É preciso aceitar a política de privacidade vigente")
        }
        PasswordPolicy.violation(command.password)?.let { throw ValidationException("password", it) }

        val email = normalizeEmail(command.email)
        if (users.existsByEmail(email)) throw emailAlreadyUsed()

        val user = UserEntity(
            id = UUID.randomUUID(),
            email = email,
            passwordHash = passwordEncoder.encode(command.password)!!,
            name = command.name.trim(),
            privacyVersion = properties.privacyVersion,
            privacyAcceptedAt = clock.instant(),
        )
        try {
            users.saveAndFlush(user)
        } catch (ex: DataIntegrityViolationException) {
            throw emailAlreadyUsed()
        }
        events.publishEvent(UserRegistered(user.id))
        return issueTokens(user)
    }

    @Transactional
    fun login(email: String, password: String): AuthResult {
        val user = users.findByEmail(normalizeEmail(email))
        val matches = !PasswordPolicy.exceedsMaxBytes(password) &&
            passwordEncoder.matches(password, user?.passwordHash ?: dummyHash)
        if (user == null || !matches) {
            throw UnauthorizedException("E-mail ou senha inválidos", "INVALID_CREDENTIALS")
        }
        return issueTokens(user)
    }

    private fun issueTokens(user: UserEntity) =
        AuthResult(accessTokens.issue(user.id), refreshTokens.create(user.id), user)

    private fun normalizeEmail(email: String) = email.trim().lowercase()

    private fun emailAlreadyUsed() = BusinessRuleException("EMAIL_ALREADY_USED", "E-mail já cadastrado")
}
