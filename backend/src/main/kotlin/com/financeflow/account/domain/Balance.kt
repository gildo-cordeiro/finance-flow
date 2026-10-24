package com.financeflow.account.domain

import java.math.BigDecimal
import java.util.UUID

/** Soma das transações pagas de uma conta: receitas e transferências recebidas entram, despesas e enviadas saem. */
interface PaidTotals {
    val accountId: UUID
    val inflow: BigDecimal
    val outflow: BigDecimal
}

/** RN-07, ADR-0011: saldo = saldo inicial + entradas pagas − saídas pagas. Nunca é armazenado. */
object Balance {

    fun of(initialBalance: BigDecimal, paid: PaidTotals?): BigDecimal =
        if (paid == null) initialBalance else initialBalance + paid.inflow - paid.outflow
}
