package com.financeflow.shared.time

import com.financeflow.shared.error.NotFoundException
import com.financeflow.support.ApiTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.put
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals

class UserClockTest : ApiTest() {

    @Autowired
    private lateinit var timezones: UserTimezones

    // 02:00 UTC de 25/10: ainda é dia 24 em São Paulo (UTC-3) e já é dia 25 em Tóquio (UTC+9)
    private val clock = Clock.fixed(Instant.parse("2026-10-25T02:00:00Z"), ZoneOffset.UTC)

    @Test
    fun `hoje segue o fuso do usuário e muda assim que o fuso é alterado`() {
        val userClock = UserClock(clock, timezones)
        val user = createUser()

        assertEquals(ZoneId.of("America/Sao_Paulo"), userClock.zone(user.id))
        assertEquals(LocalDate.of(2026, 10, 24), userClock.today(user.id))

        mockMvc.put("/api/v1/me") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Maria", "timezone": "Asia/Tokyo"}"""
        }.andExpect { status { isOk() } }

        assertEquals(LocalDate.of(2026, 10, 25), userClock.today(user.id))
    }

    @Test
    fun `usuário inexistente lança NotFoundException`() {
        assertThrows<NotFoundException> { UserClock(clock, timezones).today(UUID.randomUUID()) }
    }
}
