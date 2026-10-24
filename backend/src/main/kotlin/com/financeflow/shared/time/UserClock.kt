package com.financeflow.shared.time

import org.springframework.stereotype.Component
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

/** Fuso configurado por cada usuário. Implementado pelo módulo dono do cadastro (`auth`). */
fun interface UserTimezones {
    fun of(userId: UUID): ZoneId
}

/**
 * O "hoje" de cada usuário, no fuso que ele configurou (RF-005). É a referência para atraso,
 * vencimentos próximos e mês corrente. Lê o fuso a cada chamada, então uma alteração vale na hora.
 */
@Component
class UserClock(private val clock: Clock, private val timezones: UserTimezones) {

    fun zone(userId: UUID): ZoneId = timezones.of(userId)

    fun today(userId: UUID): LocalDate = LocalDate.now(clock.withZone(zone(userId)))
}
