package com.financeflow.account.domain

import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.util.UUID
import kotlin.test.assertEquals

class BalanceTest {

    @Test
    fun `sem transações pagas o saldo é o saldo inicial`() {
        assertEquals(BigDecimal("150.00"), Balance.of(BigDecimal("150.00"), null))
    }

    @Test
    fun `receitas pagas somam e despesas pagas subtraem`() {
        assertEquals(BigDecimal("-30.00"), Balance.of(BigDecimal("100.00"), totals(income = "20.00", expense = "150.00")))
    }

    @Test
    fun `cartão não é conta bancária`() {
        assertEquals(listOf(AccountType.CHECKING, AccountType.SAVINGS), AccountType.entries.filter { it.isBankAccount })
    }

    private fun totals(income: String, expense: String) = object : PaidTotals {
        override val accountId: UUID = UUID.randomUUID()
        override val income = BigDecimal(income)
        override val expense = BigDecimal(expense)
    }
}
