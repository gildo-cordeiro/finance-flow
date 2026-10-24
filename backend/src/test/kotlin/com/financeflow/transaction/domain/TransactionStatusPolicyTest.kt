package com.financeflow.transaction.domain

import com.financeflow.transaction.domain.TransactionStatus.OVERDUE
import com.financeflow.transaction.domain.TransactionStatus.PAID
import com.financeflow.transaction.domain.TransactionStatus.PENDING
import com.financeflow.transaction.domain.TransactionStatus.PLANNED
import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class TransactionStatusPolicyTest {

    private val today = LocalDate.of(2026, 10, 24)

    @Test
    fun `pago exige data de pagamento e só pago aceita data`() {
        assertNotNull(TransactionStatusPolicy.violation(PAID, null))
        assertNotNull(TransactionStatusPolicy.violation(PENDING, today))
        assertNull(TransactionStatusPolicy.violation(PAID, today))
        assertNull(TransactionStatusPolicy.violation(PLANNED, null))
    }

    @Test
    fun `atrasado é não pago com vencimento antes de hoje`() {
        assertTrue(TransactionStatusPolicy.isOverdue(PENDING, today.minusDays(1), today))
        assertFalse(TransactionStatusPolicy.isOverdue(PENDING, today, today))
        assertFalse(TransactionStatusPolicy.isOverdue(PAID, today.minusDays(1), today))
        assertFalse(TransactionStatusPolicy.isOverdue(PENDING, null, today))
    }

    @Test
    fun `sem status pedido, data de pagamento vira pago e sem ela pendente`() {
        assertEquals(PAID, TransactionStatusPolicy.resolve(null, today, today, today))
        assertEquals(PENDING, TransactionStatusPolicy.resolve(null, null, today.plusDays(3), today))
    }

    @Test
    fun `não pago com vencimento passado vira atrasado`() {
        assertEquals(OVERDUE, TransactionStatusPolicy.resolve(null, null, today.minusDays(1), today))
        assertEquals(OVERDUE, TransactionStatusPolicy.resolve(PLANNED, null, today.minusDays(1), today))
    }

    @Test
    fun `atrasado pedido com vencimento futuro volta a pendente`() {
        assertEquals(PENDING, TransactionStatusPolicy.resolve(OVERDUE, null, today.plusDays(1), today))
        assertEquals(PLANNED, TransactionStatusPolicy.resolve(PLANNED, null, today.plusDays(1), today))
    }
}
