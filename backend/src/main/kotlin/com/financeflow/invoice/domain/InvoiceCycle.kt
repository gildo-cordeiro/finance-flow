package com.financeflow.invoice.domain

import java.time.LocalDate
import java.time.YearMonth

/**
 * Ciclo da fatura (RN-04): do fechamento anterior, exclusive, até o fechamento seguinte, inclusive. Em mês mais
 * curto que o dia configurado, o fechamento e o vencimento caem no último dia do mês.
 */
object InvoiceCycle {

    fun closingIn(month: YearMonth, day: Int): LocalDate = month.atDay(minOf(day, month.lengthOfMonth()))

    /** Primeiro fechamento no dia configurado a partir de `date`, inclusive. */
    fun nextClosing(date: LocalDate, closingDay: Int): LocalDate {
        val month = YearMonth.from(date)
        val closing = closingIn(month, closingDay)
        return if (date.isAfter(closing)) closingIn(month.plusMonths(1), closingDay) else closing
    }

    /** Primeiro dia de vencimento depois do fechamento: fechamento dia 25 e vencimento dia 5 vencem no mês seguinte. */
    fun dueDate(closing: LocalDate, dueDay: Int): LocalDate {
        val month = YearMonth.from(closing)
        val due = closingIn(month, dueDay)
        return if (due.isAfter(closing)) due else closingIn(month.plusMonths(1), dueDay)
    }

    /**
     * Fechamento da fatura de uma compra. Uma fatura já criada mantém o ciclo dela mesmo depois de o usuário mudar
     * o dia de fechamento; o novo dia vale para as faturas que ainda não existem (ADR-0009). Por isso o ciclo de
     * transição pode ficar mais curto ou mais longo que um mês.
     */
    fun closingFor(purchaseDate: LocalDate, closingDay: Int, existingClosings: Collection<LocalDate>): LocalDate {
        val theoretical = nextClosing(purchaseDate, closingDay)
        val existing = existingClosings.filter { !it.isBefore(purchaseDate) }.minOrNull() ?: return theoretical
        if (!existing.isAfter(theoretical)) return existing
        // A fatura existente fecha depois do dia novo: ela fica com a compra se o ciclo dela, pelo dia antigo, a contém
        return if (purchaseDate.isAfter(previousClosing(existing))) existing else theoretical
    }

    private fun previousClosing(closing: LocalDate): LocalDate {
        val previousMonth = YearMonth.from(closing).minusMonths(1)
        return if (closing.dayOfMonth == closing.lengthOfMonth()) {
            previousMonth.atEndOfMonth()
        } else {
            closingIn(previousMonth, closing.dayOfMonth)
        }
    }
}
