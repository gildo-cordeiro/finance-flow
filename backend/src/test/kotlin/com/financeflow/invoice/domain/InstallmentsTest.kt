package com.financeflow.invoice.domain

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.math.BigDecimal
import kotlin.test.assertEquals

class InstallmentsTest {

    @Test
    fun `centavos que sobram vão para a última parcela`() {
        assertEquals(
            listOf(BigDecimal("33.33"), BigDecimal("33.33"), BigDecimal("33.34")),
            Installments.split(BigDecimal("100.00"), 3),
        )
    }

    @Test
    fun `à vista é uma parcela só com o valor inteiro`() {
        assertEquals(listOf(BigDecimal("59.90")), Installments.split(BigDecimal("59.90"), 1))
    }

    @Test
    fun `a soma das parcelas é o valor da compra`() {
        val parts = Installments.split(BigDecimal("1999.99"), 7)
        assertEquals(BigDecimal("1999.99"), parts.reduce(BigDecimal::add))
    }

    @Test
    fun `número de parcelas fora do limite é recusado`() {
        assertThrows<IllegalArgumentException> { Installments.split(BigDecimal.TEN, 0) }
        assertThrows<IllegalArgumentException> { Installments.split(BigDecimal.TEN, Installments.MAX + 1) }
    }
}
