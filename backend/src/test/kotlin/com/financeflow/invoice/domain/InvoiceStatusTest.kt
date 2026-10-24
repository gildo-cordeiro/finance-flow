package com.financeflow.invoice.domain

import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals

class InvoiceStatusTest {

    private val closing = LocalDate.of(2026, 6, 25)

    @Test
    fun `aberta até o dia do fechamento e fechada depois`() {
        assertEquals(InvoiceStatus.OPEN, InvoiceStatus.of(InvoiceStatus.OPEN, closing, closing))
        assertEquals(InvoiceStatus.CLOSED, InvoiceStatus.of(InvoiceStatus.OPEN, closing, closing.plusDays(1)))
    }

    @Test
    fun `pagamento vale mais que a data`() {
        assertEquals(InvoiceStatus.PAID, InvoiceStatus.of(InvoiceStatus.PAID, closing, closing.minusDays(3)))
        assertEquals(InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.of(InvoiceStatus.PARTIALLY_PAID, closing, closing.plusDays(9)))
    }
}
