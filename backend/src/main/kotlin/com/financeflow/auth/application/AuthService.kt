package com.financeflow.auth.application

import com.financeflow.auth.UserRegistered
import com.financeflow.auth.domain.EmailAddress
import com.financeflow.auth.domain.PasswordPolicy
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

data class AuthenticatedUser(val id: UUID, val name: String, val email: String)

data class AuthResult(val accessToken: AccessToken, val refreshToken: String, val user: AuthenticatedUser)

@Service
class AuthService(
    private val users: UserRepository,
    private val sessions: SessionService,
    private val accessTokens: TokenIssuer,
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

        val email = EmailAddress.normalize(command.email)
        if (!EmailAddress.isValid(email)) throw ValidationException("email", "E-mail inválido")
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
        val user = users.findByEmail(EmailAddress.normalize(email))
        val matches = !PasswordPolicy.exceedsMaxBytes(password) &&
            passwordEncoder.matches(password, user?.passwordHash ?: dummyHash)
        if (user == null || !matches) {
            throw UnauthorizedException("E-mail ou senha inválidos", "INVALID_CREDENTIALS")
        }
        return issueTokens(user)
    }

    /** Renova a sessão com rotação do refresh token (RF-003). */
    @Transactional(noRollbackFor = [UnauthorizedException::class])
    fun refresh(refreshToken: String): AuthResult {
        val session = sessions.rotate(refreshToken)
        val user = users.findById(session.userId).orElseThrow()
        return AuthResult(accessTokens.issue(user.id), session.refreshToken, user.toAuthenticated())
    }

    fun logout(refreshToken: String) = sessions.revoke(refreshToken)

    private fun issueTokens(user: UserEntity) =
        AuthResult(accessTokens.issue(user.id), sessions.create(user.id), user.toAuthenticated())

    private fun UserEntity.toAuthenticated() = AuthenticatedUser(id, name, email)

    private fun emailAlreadyUsed() = BusinessRuleException("EMAIL_ALREADY_USED", "E-mail já cadastrado")
}
