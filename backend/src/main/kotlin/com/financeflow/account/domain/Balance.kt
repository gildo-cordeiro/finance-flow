package com.financeflow.account.domain

import java.math.BigDecimal
import java.util.UUID

/** Soma das transações pagas de uma conta, por tipo. */
interface PaidTotals {
    val accountId: UUID
    val income: BigDecimal
    val expense: BigDecimal
}

/** RN-07, ADR-0011: saldo = saldo inicial + receitas pagas − despesas pagas. Nunca é armazenado. */
object Balance {

    fun of(initialBalance: BigDecimal, paid: PaidTotals?): BigDecimal =
        if (paid == null) initialBalance else initialBalance + paid.income - paid.expense
}
