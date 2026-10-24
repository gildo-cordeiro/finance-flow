package com.financeflow.auth.application

import com.financeflow.auth.domain.Timezone
import com.financeflow.auth.infra.UserEntity
import com.financeflow.auth.infra.UserRepository
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.error.ValidationException
import com.financeflow.shared.security.CurrentUser
import com.financeflow.shared.time.UserTimezones
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.ZoneId
import java.util.UUID

data class Profile(
    val id: UUID,
    val name: String,
    val email: String,
    val timezone: String,
    val currency: String,
    val privacyVersion: String?,
)

data class UpdateProfileCommand(val name: String, val timezone: String)

/** Perfil e configurações do usuário autenticado (RF-005). */
@Service
class ProfileService(
    private val users: UserRepository,
    private val currentUser: CurrentUser,
) : UserTimezones {

    @Transactional(readOnly = true)
    fun get(): Profile = current().toProfile()

    @Transactional
    fun update(command: UpdateProfileCommand): Profile {
        if (!Timezone.isValid(command.timezone)) throw ValidationException("timezone", "Fuso horário inválido")
        val user = current()
        user.name = command.name.trim()
        user.timezone = command.timezone
        return user.toProfile()
    }

    @Transactional(readOnly = true)
    override fun of(userId: UUID): ZoneId =
        ZoneId.of(users.findTimezoneById(userId) ?: throw NotFoundException())

    private fun current() = users.findByIdOrNull(currentUser.id()) ?: throw NotFoundException()

    private fun UserEntity.toProfile() = Profile(id, name, email, timezone, currency, privacyVersion)
}
