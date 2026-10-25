package com.financeflow.auth.api.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
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
