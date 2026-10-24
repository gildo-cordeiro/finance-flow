package com.financeflow.auth.api

import com.financeflow.auth.application.Profile
import com.financeflow.auth.application.ProfileService
import com.financeflow.auth.application.UpdateProfileCommand
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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

@Tag(name = "Perfil")
@RestController
@RequestMapping("/api/v1/me")
class ProfileController(private val profileService: ProfileService) {

    @Operation(summary = "Perfil do usuário autenticado")
    @GetMapping
    fun get() = profileService.get().toResponse()

    @Operation(summary = "Altera nome e fuso horário", description = "O fuso define o \"hoje\" do usuário (vencimentos, atrasos, mês corrente).")
    @PutMapping
    fun update(@Valid @RequestBody request: UpdateProfileRequest) =
        profileService.update(UpdateProfileCommand(request.name, request.timezone)).toResponse()

    private fun Profile.toResponse() = ProfileResponse(id, name, email, timezone, currency, privacyVersion)
}
