package com.financeflow.transaction.domain

import com.financeflow.shared.error.ValidationException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import kotlin.test.assertEquals
import kotlin.test.assertNull

class EntryTest {

    private val today = LocalDate.of(2026, 10, 24)

    private fun entry(
        competence: YearMonth? = null,
        due: LocalDate? = LocalDate.of(2026, 11, 5),
        paid: LocalDate? = null,
        status: TransactionStatus? = null,
        offset: Int = 0,
        type: TransactionType = TransactionType.EXPENSE,
    ) = Entry.of(type, BigDecimal("100.00"), competence, due, paid, status, offset, today)

    @Test
    fun `sem competência informada usa a sugestão pelo vencimento e deslocamento`() {
        assertEquals(YearMonth.of(2026, 10), entry(offset = 1).competence)
    }

    @Test
    fun `competência informada vale sobre a sugestão`() {
        assertEquals(YearMonth.of(2027, 1), entry(competence = YearMonth.of(2027, 1), offset = 1).competence)
    }

    @Test
    fun `sem vencimento a referência é o pagamento e sem nenhum dos dois é recusado`() {
        assertEquals(YearMonth.of(2026, 9), entry(due = null, paid = LocalDate.of(2026, 9, 30)).competence)
        val error = assertThrows<ValidationException> { entry(due = null) }
        assertEquals("dueDate", error.fields.single().field)
    }

    @Test
    fun `status pedido incoerente com a data de pagamento é recusado`() {
        assertThrows<ValidationException> { entry(status = TransactionStatus.PAID) }
        assertThrows<ValidationException> { entry(status = TransactionStatus.PENDING, paid = today) }
    }

    @Test
    fun `transferência não é lançada como receita ou despesa`() {
        val error = assertThrows<ValidationException> { entry(type = TransactionType.TRANSFER) }
        assertEquals("type", error.fields.single().field)
    }

    @Test
    fun `pagar e desfazer o pagamento recalculam o status`() {
        val overdue = entry(due = today.minusDays(1))
        assertEquals(TransactionStatus.OVERDUE, overdue.status)

        val paid = overdue.paid(today)
        assertEquals(TransactionStatus.PAID, paid.status)
        assertEquals(today, paid.paymentDate)

        val undone = paid.unpaid(today)
        assertEquals(TransactionStatus.OVERDUE, undone.status)
        assertNull(undone.paymentDate)
        assertEquals(undone, undone.unpaid(today))
    }
}
