package com.financeflow.auth.api.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class UpdateProfileRequest(
    @field:NotBlank @field:Size(max = 120)
    val name: String = "",
    @field:NotBlank
    val timezone: String = "",
)

data class ProfileResponse(
    val id: UUID,
    val name: String,
    val email: String,
    val timezone: String,
    val currency: String,
    val privacyVersion: String?,
)
