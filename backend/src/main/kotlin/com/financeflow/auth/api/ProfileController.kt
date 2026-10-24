package com.financeflow.auth.api

import com.financeflow.auth.application.Profile
import com.financeflow.auth.application.ProfileService
import com.financeflow.auth.application.UpdateProfileCommand
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
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

@RestController
@RequestMapping("/api/v1/me")
class ProfileController(private val profileService: ProfileService) {

    @GetMapping
    fun get() = profileService.get().toResponse()

    @PutMapping
    fun update(@Valid @RequestBody request: UpdateProfileRequest) =
        profileService.update(UpdateProfileCommand(request.name, request.timezone)).toResponse()

    private fun Profile.toResponse() = ProfileResponse(id, name, email, timezone, currency, privacyVersion)
}
