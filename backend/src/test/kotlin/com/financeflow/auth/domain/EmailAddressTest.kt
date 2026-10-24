package com.financeflow.auth.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class EmailAddressTest {

    @Test
    fun `normaliza tirando espaços e passando para minúsculas`() {
        assertEquals("ana@exemplo.com", EmailAddress.normalize("  Ana@Exemplo.COM "))
    }

    @Test
    fun `aceita e-mail com usuário, domínio e extensão`() {
        assertTrue(EmailAddress.isValid("ana@exemplo.com"))
    }

    @Test
    fun `recusa e-mail sem arroba, sem extensão ou com espaço`() {
        listOf("ana.exemplo.com", "ana@exemplo", "ana silva@exemplo.com").forEach {
            assertFalse(EmailAddress.isValid(it), it)
        }
    }
}
