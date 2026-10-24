package com.financeflow.invoice

import com.financeflow.invoice.application.InvoiceService
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/** Fatura do usuário autenticado ainda não quitada, com o total calculado dos itens (ADR-0009). */
data class UpcomingInvoice(
    val id: UUID,
    val cardId: UUID,
    val cardName: String,
    val dueDate: LocalDate,
    val total: BigDecimal,
    val openAmount: BigDecimal,
    val partiallyPaid: Boolean,
    val overdue: Boolean,
)

@Service
class InvoiceAgenda(private val invoiceService: InvoiceService) {

    /** Faturas com saldo em aberto vencidas ou que vencem nos próximos `days` dias, por vencimento. */
    fun upcoming(days: Long): List<UpcomingInvoice> = invoiceService.upcoming(days).map {
        UpcomingInvoice(
            id = checkNotNull(it.summary.id),
            cardId = it.summary.cardId,
            cardName = it.cardName,
            dueDate = it.summary.dueDate,
            total = it.summary.total,
            openAmount = it.summary.openAmount,
            partiallyPaid = it.summary.paidAmount.signum() > 0,
            overdue = it.overdue,
        )
    }
}
