package com.financeflow.account.domain

import java.math.BigDecimal
import java.util.UUID

/** Quanto do limite as faturas não quitadas de um cartão ocupam: total dos itens menos o já pago. */
interface CardUsage {
    val cardId: UUID
    val used: BigDecimal
}

/** RF-034, ADR-0039: disponível = limite − usado. Fica negativo quando as compras passam do limite. */
object CreditLimit {

    fun available(limit: BigDecimal, used: BigDecimal): BigDecimal = limit - used
}
