package com.financeflow.invoice.domain

import java.math.BigDecimal
import java.math.RoundingMode

object Installments {

    const val MAX = 48

    /** RF-023: parcelas iguais, com os centavos que sobram na última. */
    fun split(total: BigDecimal, count: Int): List<BigDecimal> {
        require(count in 1..MAX) { "Número de parcelas fora de 1 a $MAX" }
        val installment = total.divide(BigDecimal(count), 2, RoundingMode.DOWN)
        val last = total - installment * BigDecimal(count - 1)
        return List(count - 1) { installment } + last
    }
}
