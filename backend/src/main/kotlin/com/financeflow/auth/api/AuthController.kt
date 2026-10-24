package com.financeflow.auth.api

import com.financeflow.auth.application.AuthProperties
import com.financeflow.auth.application.AuthResult
import com.financeflow.auth.application.AuthService
import com.financeflow.auth.application.PasswordResetService
import com.financeflow.auth.application.RegisterCommand
import com.financeflow.auth.domain.EmailAddress
import com.financeflow.shared.error.UnauthorizedException
import com.financeflow.shared.ratelimit.ClientIp
import com.financeflow.shared.ratelimit.RateLimit
import com.financeflow.shared.ratelimit.RateLimiter
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration
import java.util.UUID

data class RegisterRequest(
    @field:NotBlank @field:Size(max = 120)
    val name: String = "",
    @field:NotBlank @field:Size(max = 255)
    val email: String = "",
    @field:NotBlank
    val password: String = "",
    @field:NotBlank(message = "É preciso aceitar a política de privacidade")
    val acceptedPrivacyVersion: String = "",
)

data class LoginRequest(
    @field:NotBlank
    val email: String = "",
    @field:NotBlank
    val password: String = "",
)

data class ForgotPasswordRequest(
    @field:NotBlank @field:Size(max = 255)
    val email: String = "",
)

data class ResetPasswordRequest(
    @field:NotBlank
    val token: String = "",
    @field:NotBlank
    val newPassword: String = "",
)

data class UserResponse(val id: UUID, val name: String, val email: String)

data class AuthResponse(val accessToken: String, val expiresIn: Long, val user: UserResponse)

data class PrivacyPolicyResponse(val version: String)

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService,
    private val passwordResetService: PasswordResetService,
    private val properties: AuthProperties,
    private val rateLimiter: RateLimiter,
    private val clientIp: ClientIp,
) {

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        val result = authService.register(
            RegisterCommand(request.name, request.email, request.password, request.acceptedPrivacyVersion),
        )
        return respond(HttpStatus.CREATED, result)
    }

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        servletRequest: HttpServletRequest,
    ): ResponseEntity<AuthResponse> {
        rateLimiter.consume(LOGIN_PER_IP, clientIp.of(servletRequest))
        rateLimiter.consume(LOGIN_PER_EMAIL, EmailAddress.normalize(request.email))
        return respond(HttpStatus.OK, authService.login(request.email, request.password))
    }

    @PostMapping("/refresh")
    fun refresh(
        @CookieValue(REFRESH_COOKIE, required = false) refreshToken: String?,
        servletRequest: HttpServletRequest,
    ): ResponseEntity<AuthResponse> {
        rateLimiter.consume(REFRESH_PER_IP, clientIp.of(servletRequest))
        if (refreshToken.isNullOrBlank()) {
            throw UnauthorizedException("Sessão inválida ou expirada", "INVALID_REFRESH_TOKEN")
        }
        return respond(HttpStatus.OK, authService.refresh(refreshToken))
    }

    @PostMapping("/logout")
    fun logout(@CookieValue(REFRESH_COOKIE, required = false) refreshToken: String?): ResponseEntity<Unit> {
        if (!refreshToken.isNullOrBlank()) authService.logout(refreshToken)
        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
            .build()
    }

    /** Sempre 204, exista ou não o e-mail, para não revelar o cadastro (RF-004). */
    @PostMapping("/password/forgot")
    fun forgotPassword(
        @Valid @RequestBody request: ForgotPasswordRequest,
        servletRequest: HttpServletRequest,
    ): ResponseEntity<Unit> {
        rateLimiter.consume(FORGOT_PER_IP, clientIp.of(servletRequest))
        rateLimiter.consume(FORGOT_PER_EMAIL, EmailAddress.normalize(request.email))
        passwordResetService.requestReset(request.email)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/password/reset")
    fun resetPassword(@Valid @RequestBody request: ResetPasswordRequest): ResponseEntity<Unit> {
        passwordResetService.reset(request.token, request.newPassword)
        return ResponseEntity.noContent().build()
    }

    /** Versão vigente da política de privacidade, que o cadastro precisa aceitar (RF-102). */
    @GetMapping("/privacy-policy")
    fun privacyPolicy() = PrivacyPolicyResponse(properties.privacyVersion)

    // ADR-0026: access token no corpo, refresh token só em cookie HttpOnly
    private fun respond(status: HttpStatus, result: AuthResult): ResponseEntity<AuthResponse> {
        val cookie = refreshCookie(result.refreshToken, properties.refreshTokenTtl)
        val user = result.user
        val body = AuthResponse(
            accessToken = result.accessToken.value,
            expiresIn = result.accessToken.expiresInSeconds,
            user = UserResponse(user.id, user.name, user.email),
        )
        return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE, cookie.toString()).body(body)
    }

    private fun refreshCookie(value: String, maxAge: Duration) =
        ResponseCookie.from(REFRESH_COOKIE, value)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/v1/auth")
            .maxAge(maxAge)
            .build()

    companion object {
        const val REFRESH_COOKIE = "refresh_token"

        // RNF-04, valores provisórios
        val LOGIN_PER_IP = RateLimit("login-ip", 5, Duration.ofMinutes(1))
        val LOGIN_PER_EMAIL = RateLimit("login-email", 10, Duration.ofHours(1))
        val REFRESH_PER_IP = RateLimit("refresh-ip", 30, Duration.ofMinutes(1))
        val FORGOT_PER_IP = RateLimit("forgot-ip", 10, Duration.ofHours(1))
        val FORGOT_PER_EMAIL = RateLimit("forgot-email", 3, Duration.ofHours(1))
    }
}
