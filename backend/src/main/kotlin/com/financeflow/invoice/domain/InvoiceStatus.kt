package com.financeflow.invoice.domain

import java.time.LocalDate

enum class InvoiceStatus {
    OPEN,
    CLOSED,
    PAID,
    PARTIALLY_PAID,
    ;

    companion object {

        /** Aberta até o dia do fechamento, inclusive; fechada depois, pelo "hoje" do usuário. Pagamento vem da F1-15. */
        fun of(stored: InvoiceStatus, closingDate: LocalDate, today: LocalDate): InvoiceStatus = when {
            stored == PAID || stored == PARTIALLY_PAID -> stored
            today.isAfter(closingDate) -> CLOSED
            else -> OPEN
        }
    }
}
