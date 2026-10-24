package com.financeflow.auth.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PasswordPolicyTest {

    @Test
    fun `aceita senha com 8 caracteres, letra e número`() {
        assertNull(PasswordPolicy.violation("abcdefg1"))
    }

    @Test
    fun `recusa senha curta`() {
        assertEquals("A senha precisa ter ao menos 8 caracteres", PasswordPolicy.violation("abc123"))
    }

    @Test
    fun `recusa senha sem número`() {
        assertEquals("A senha precisa ter ao menos um número", PasswordPolicy.violation("abcdefgh"))
    }

    @Test
    fun `recusa senha sem letra`() {
        assertEquals("A senha precisa ter ao menos uma letra", PasswordPolicy.violation("12345678"))
    }

    @Test
    fun `aceita exatamente 72 bytes e recusa 73`() {
        assertNull(PasswordPolicy.violation("a1" + "x".repeat(70)))
        assertEquals("A senha pode ter no máximo 72 bytes", PasswordPolicy.violation("a1" + "x".repeat(71)))
    }

    @Test
    fun `conta bytes e não caracteres`() {
        // "é" ocupa 2 bytes em UTF-8: 1 + 36 × 2 = 73 bytes em 37 caracteres
        assertEquals("A senha pode ter no máximo 72 bytes", PasswordPolicy.violation("1" + "é".repeat(36)))
    }
}
