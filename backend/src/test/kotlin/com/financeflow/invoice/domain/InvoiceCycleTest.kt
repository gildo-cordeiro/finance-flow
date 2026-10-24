package com.financeflow.invoice.domain

import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals

class InvoiceCycleTest {

    private fun date(month: Int, day: Int, year: Int = 2026) = LocalDate.of(year, month, day)

    @Test
    fun `compra no dia do fechamento entra na fatura que fecha nesse dia`() {
        assertEquals(date(6, 25), InvoiceCycle.closingFor(date(6, 25), 25, emptyList()))
    }

    @Test
    fun `compra um dia depois do fechamento vai para a fatura seguinte`() {
        assertEquals(date(7, 25), InvoiceCycle.closingFor(date(6, 26), 25, emptyList()))
    }

    @Test
    fun `fechamento depois do fim do mês cai no último dia`() {
        assertEquals(date(2, 28), InvoiceCycle.nextClosing(date(2, 10), 31))
        assertEquals(date(3, 31), InvoiceCycle.nextClosing(date(3, 1), 31))
    }

    @Test
    fun `vencimento é o primeiro dia de vencimento depois do fechamento`() {
        assertEquals(date(7, 5), InvoiceCycle.dueDate(date(6, 25), 5))
        assertEquals(date(6, 15), InvoiceCycle.dueDate(date(6, 5), 15))
        assertEquals(date(7, 10), InvoiceCycle.dueDate(date(6, 10), 10))
        assertEquals(date(2, 28), InvoiceCycle.dueDate(date(2, 20), 30))
    }

    @Test
    fun `vencimento atravessa a virada do ano`() {
        assertEquals(date(1, 5, 2027), InvoiceCycle.dueDate(date(12, 25), 5))
    }

    @Test
    fun `fatura já criada mantém o ciclo quando o fechamento passa para mais tarde`() {
        // Fechava dia 10; agora fecha dia 25. A fatura de 10/07 já existe.
        val existing = listOf(date(7, 10))
        assertEquals(date(7, 10), InvoiceCycle.closingFor(date(7, 5), 25, existing))
        assertEquals(date(7, 25), InvoiceCycle.closingFor(date(7, 11), 25, existing))
    }

    @Test
    fun `fatura já criada mantém o ciclo quando o fechamento passa para mais cedo`() {
        // Fechava dia 25; agora fecha dia 10. A fatura de 25/06 já existe e fica com as compras até 25/06.
        val existing = listOf(date(6, 25))
        assertEquals(date(6, 25), InvoiceCycle.closingFor(date(6, 5), 10, existing))
        assertEquals(date(6, 25), InvoiceCycle.closingFor(date(6, 20), 10, existing))
        assertEquals(date(7, 10), InvoiceCycle.closingFor(date(6, 26), 10, existing))
    }

    @Test
    fun `fatura futura não captura compra de um ciclo anterior a ela`() {
        val existing = listOf(date(9, 25))
        assertEquals(date(6, 25), InvoiceCycle.closingFor(date(6, 20), 25, existing))
    }
}
