package com.financeflow.auth.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class TimezoneTest {

    @Test
    fun `aceita IDs da base IANA`() {
        assertTrue(Timezone.isValid("America/Sao_Paulo"))
        assertTrue(Timezone.isValid("America/Manaus"))
        assertTrue(Timezone.isValid("Europe/Lisbon"))
        assertTrue(Timezone.isValid(Timezone.DEFAULT))
    }

    @Test
    fun `recusa offsets fixos, IDs inexistentes e texto vazio`() {
        assertFalse(Timezone.isValid("-03:00"))
        assertFalse(Timezone.isValid("UTC-3"))
        assertFalse(Timezone.isValid("Z"))
        assertFalse(Timezone.isValid("America/Atlantida"))
        assertFalse(Timezone.isValid("america/sao_paulo"))
        assertFalse(Timezone.isValid(""))
    }
}
