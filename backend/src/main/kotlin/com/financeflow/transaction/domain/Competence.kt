package com.financeflow.transaction.domain

import java.time.LocalDate
import java.time.YearMonth

/** RN-03, ADR-0008: competência sugerida = mês da data de referência − deslocamento. */
object Competence {

    fun suggest(referenceDate: LocalDate, offset: Int): YearMonth =
        YearMonth.from(referenceDate).minusMonths(offset.toLong())

    /** Fora do cartão, a referência é o vencimento; sem ele, o pagamento (ADR-0038). */
    fun referenceDate(dueDate: LocalDate?, paymentDate: LocalDate?): LocalDate? = dueDate ?: paymentDate
}
