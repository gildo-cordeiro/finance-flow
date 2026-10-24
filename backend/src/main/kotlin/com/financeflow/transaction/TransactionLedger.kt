package com.financeflow.transaction

import com.financeflow.transaction.application.TransactionService
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

/** Quanto o usuário autenticado lançou numa categoria na competência, e quanto disso já foi pago. */
data class CategoryRealized(val categoryId: UUID, val realized: BigDecimal, val realizedPaid: BigDecimal)

/** Receitas e despesas da competência, sem transferências, e quanto de cada uma já foi pago. */
data class MonthResult(
    val income: BigDecimal,
    val incomePaid: BigDecimal,
    val expense: BigDecimal,
    val expensePaid: BigDecimal,
)

data class PayableEntry(
    val id: UUID,
    val description: String,
    val amount: BigDecimal,
    val accountName: String,
    val categoryName: String?,
    val dueDate: LocalDate,
    val overdue: Boolean,
)

data class Payables(val items: List<PayableEntry>, val overdueCount: Long)

@Service
class TransactionLedger(private val transactionService: TransactionService) {

    /** Todos os status contam, porque a competência diz a que mês o gasto pertence; transferências não (RF-013). */
    fun realizedByCategory(month: YearMonth): List<CategoryRealized> =
        transactionService.totalsByCategory(month).map { CategoryRealized(it.categoryId, it.total, it.paid) }

    fun monthResult(month: YearMonth): MonthResult =
        transactionService.monthTotals(month).let { MonthResult(it.income, it.incomePaid, it.expense, it.expensePaid) }

    /** Despesas não pagas atrasadas ou com vencimento nos próximos `days` dias, da mais antiga para a mais nova. */
    fun payables(days: Long, limit: Int): Payables {
        val (items, overdue) = transactionService.payables(days, limit)
        return Payables(
            items.map { PayableEntry(it.id, it.description, it.amount, it.accountName, it.categoryName, it.dueDate, it.overdue) },
            overdue,
        )
    }
}
