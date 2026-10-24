package com.financeflow.auth.application

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Duration
import kotlin.test.assertEquals

class AuthPropertiesTest {

    @Test
    fun `segredo do JWT com menos de 32 bytes impede a inicialização`() {
        val ex = assertThrows<IllegalArgumentException> { properties(secret = "curto") }
        assertEquals("APP_JWT_SECRET precisa ter ao menos 32 bytes", ex.message)
    }

    @Test
    fun `versão da política de privacidade vazia impede a inicialização`() {
        assertThrows<IllegalArgumentException> { properties(privacyVersion = " ") }
    }

    private fun properties(secret: String = "x".repeat(32), privacyVersion: String = "2026-10") =
        AuthProperties(secret, privacyVersion, Duration.ofMinutes(15), Duration.ofDays(30))
}
