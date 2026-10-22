package com.financeflow.auth.api

import com.financeflow.auth.application.AuthResult
import com.financeflow.auth.application.AuthService
import com.financeflow.auth.application.RegisterCommand
import com.financeflow.auth.infra.AuthProperties
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

data class RegisterRequest(
    @field:NotBlank @field:Size(max = 120)
    val name: String = "",
    @field:NotBlank @field:Email @field:Size(max = 255)
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

data class UserResponse(val id: UUID, val name: String, val email: String)

data class AuthResponse(val accessToken: String, val expiresIn: Long, val user: UserResponse)

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService,
    private val properties: AuthProperties,
) {

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<AuthResponse> {
        val result = authService.register(
            RegisterCommand(request.name, request.email, request.password, request.acceptedPrivacyVersion),
        )
        return respond(HttpStatus.CREATED, result)
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<AuthResponse> =
        respond(HttpStatus.OK, authService.login(request.email, request.password))

    // ADR-0026: access token no corpo, refresh token só em cookie HttpOnly
    private fun respond(status: HttpStatus, result: AuthResult): ResponseEntity<AuthResponse> {
        val cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/v1/auth")
            .maxAge(properties.refreshTokenTtl)
            .build()
        val user = result.user
        val body = AuthResponse(
            accessToken = result.accessToken.value,
            expiresIn = result.accessToken.expiresInSeconds,
            user = UserResponse(user.id, user.name, user.email),
        )
        return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE, cookie.toString()).body(body)
    }

    companion object {
        const val REFRESH_COOKIE = "refresh_token"
    }
}
