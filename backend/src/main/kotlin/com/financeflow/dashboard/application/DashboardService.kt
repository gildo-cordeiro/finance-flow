package com.financeflow.dashboard.application

import com.financeflow.account.AccountBalance
import com.financeflow.account.AccountDirectory
import com.financeflow.budget.BudgetOverview
import com.financeflow.budget.ExpenseBudget
import com.financeflow.invoice.InvoiceAgenda
import com.financeflow.invoice.UpcomingInvoice
import com.financeflow.shared.security.CurrentUser
import com.financeflow.shared.time.UserClock
import com.financeflow.transaction.MonthResult
import com.financeflow.transaction.Payables
import com.financeflow.transaction.TransactionLedger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.YearMonth

data class DashboardSummary(
    val month: YearMonth,
    val result: MonthResult,
    val accounts: List<AccountBalance>,
    val payables: Payables,
    val invoices: List<UpcomingInvoice>,
    val budget: ExpenseBudget,
) {
    val balance: BigDecimal get() = result.income - result.expense

    val accountsBalance: BigDecimal get() = accounts.fold(BigDecimal.ZERO) { acc, it -> acc + it.balance }
}

/** Resumo do mês: cada bloco vem de uma consulta agregada do módulo dono do dado (RF-050). */
@Service
class DashboardService(
    private val ledger: TransactionLedger,
    private val accounts: AccountDirectory,
    private val budgets: BudgetOverview,
    private val invoices: InvoiceAgenda,
    private val currentUser: CurrentUser,
    private val userClock: UserClock,
) {

    /** Sem mês, usa a competência corrente: o mês de hoje no fuso do usuário (RN-02). */
    @Transactional(readOnly = true)
    fun summary(month: YearMonth?): DashboardSummary {
        val competence = month ?: YearMonth.from(userClock.today(currentUser.id()))
        return DashboardSummary(
            month = competence,
            result = ledger.monthResult(competence),
            accounts = accounts.balances(),
            payables = ledger.payables(days = UPCOMING_DAYS, limit = PAYABLES_LIMIT),
            invoices = invoices.upcoming(days = INVOICE_DAYS),
            budget = budgets.expenses(competence, highlights = BUDGET_HIGHLIGHTS),
        )
    }

    private companion object {
        const val UPCOMING_DAYS = 7L
        const val PAYABLES_LIMIT = 8
        const val INVOICE_DAYS = 30L
        const val BUDGET_HIGHLIGHTS = 5
    }
}
