package com.financeflow.budget.application

import com.financeflow.budget.domain.BudgetCategory
import com.financeflow.budget.domain.BudgetLine
import com.financeflow.budget.domain.BudgetTotals
import com.financeflow.budget.domain.BudgetTree
import com.financeflow.budget.domain.Realized
import com.financeflow.budget.infra.BudgetEntity
import com.financeflow.budget.infra.BudgetRepository
import com.financeflow.category.CategoryDirectory
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.security.CurrentUser
import com.financeflow.transaction.TransactionLedger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Clock
import java.time.YearMonth
import java.util.UUID

data class BudgetView(
    val month: YearMonth,
    val lines: List<BudgetLine>,
    val income: BudgetTotals,
    val expense: BudgetTotals,
    val previousMonthPlanned: BigDecimal,
)

/** Orçamento mensal por competência: planejado guardado, realizado calculado (RF-040 a RF-042). */
@Service
class BudgetService(
    private val budgets: BudgetRepository,
    private val categories: CategoryDirectory,
    private val ledger: TransactionLedger,
    private val currentUser: CurrentUser,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun view(month: YearMonth): BudgetView {
        val userId = currentUser.id()
        val planned = budgets.findByUserIdAndMonth(userId, month.atDay(1)).associate { it.categoryId to it.plannedAmount }
        val realized = ledger.realizedByCategory(month).associate { it.categoryId to Realized(it.realized, it.realizedPaid) }
        val categoryList = categories.all().map { BudgetCategory(it.id, it.name, it.income, it.archived, it.parentId) }
        val lines = BudgetTree.build(categoryList, planned, realized)
        val previous = budgets.findByUserIdAndMonth(userId, month.minusMonths(1).atDay(1))
        return BudgetView(
            month = month,
            lines = lines,
            income = BudgetTree.totals(lines, income = true),
            expense = BudgetTree.totals(lines, income = false),
            previousMonthPlanned = previous.fold(BigDecimal.ZERO) { acc, it -> acc + it.plannedAmount },
        )
    }

    /** Zero remove o planejado da categoria no mês. */
    @Transactional
    fun setPlanned(month: YearMonth, categoryId: UUID, amount: BigDecimal): BudgetView {
        val userId = currentUser.id()
        val category = categories.find(categoryId) ?: throw NotFoundException()
        if (category.archived) {
            throw BusinessRuleException("CATEGORY_ARCHIVED", "Desarquive a categoria para planejar um valor")
        }
        val existing = budgets.findByUserIdAndMonth(userId, month.atDay(1)).find { it.categoryId == categoryId }
        when {
            amount.signum() == 0 -> existing?.let { budgets.delete(it) }
            existing != null -> existing.update(amount)
            else -> budgets.save(newBudget(userId, categoryId, month, amount))
        }
        budgets.flush()
        return view(month)
    }

    /** Copia o planejado do mês anterior; sem `overwrite`, mantém o que já foi planejado no mês (RF-041). */
    @Transactional
    fun copyFromPrevious(month: YearMonth, overwrite: Boolean): BudgetView {
        val userId = currentUser.id()
        val previous = budgets.findByUserIdAndMonth(userId, month.minusMonths(1).atDay(1))
        if (previous.isEmpty()) {
            throw BusinessRuleException("NO_PREVIOUS_BUDGET", "O mês anterior não tem orçamento para copiar")
        }
        val active = categories.all().filter { !it.archived }.map { it.id }.toSet()
        val current = budgets.findByUserIdAndMonth(userId, month.atDay(1)).associateBy { it.categoryId }
        previous.filter { it.categoryId in active }.forEach { source ->
            val target = current[source.categoryId]
            when {
                target == null -> budgets.save(newBudget(userId, source.categoryId, month, source.plannedAmount))
                overwrite -> target.update(source.plannedAmount)
            }
        }
        budgets.flush()
        return view(month)
    }

    private fun newBudget(userId: UUID, categoryId: UUID, month: YearMonth, amount: BigDecimal) =
        BudgetEntity(UUID.randomUUID(), userId, categoryId, month.atDay(1), amount, clock.instant())

    private fun BudgetEntity.update(amount: BigDecimal) {
        plannedAmount = amount
        updatedAt = clock.instant()
    }
}
