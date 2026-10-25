package com.financeflow.auth.api

import com.financeflow.auth.api.dto.ProfileResponse
import com.financeflow.auth.api.dto.UpdateProfileRequest
import com.financeflow.auth.application.Profile
import com.financeflow.auth.application.ProfileService
import com.financeflow.auth.application.UpdateProfileCommand
import com.financeflow.shared.error.ProblemResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Perfil", description = "Dados do usuário autenticado.")
@RestController
@RequestMapping("/api/v1/me")
class ProfileController(private val profileService: ProfileService) {

    @Operation(summary = "Perfil do usuário autenticado")
    @GetMapping
    fun get() = profileService.get().toResponse()

    @Operation(summary = "Altera nome e fuso horário")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @PutMapping
    fun update(@Valid @RequestBody request: UpdateProfileRequest) =
        profileService.update(UpdateProfileCommand(request.name, request.timezone)).toResponse()

    private fun Profile.toResponse() = ProfileResponse(id, name, email, timezone, currency, privacyVersion)
}
