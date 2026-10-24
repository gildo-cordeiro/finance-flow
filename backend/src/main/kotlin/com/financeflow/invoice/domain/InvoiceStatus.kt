package com.financeflow.invoice.domain

import java.time.LocalDate

enum class InvoiceStatus {
    OPEN,
    CLOSED,
    PAID,
    PARTIALLY_PAID,
    ;

    companion object {

        /** Aberta até o dia do fechamento, inclusive; fechada depois, pelo "hoje" do usuário. Paga e paga em parte vêm do pagamento (ADR-0039). */
        fun of(stored: InvoiceStatus, closingDate: LocalDate, today: LocalDate): InvoiceStatus = when {
            stored == PAID || stored == PARTIALLY_PAID -> stored
            today.isAfter(closingDate) -> CLOSED
            else -> OPEN
        }
    }
}
