package com.financeflow.budget

import com.financeflow.budget.application.BudgetService
import com.financeflow.budget.domain.BudgetTree
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.YearMonth
import java.util.UUID

data class BudgetCategoryUsage(
    val categoryId: UUID,
    val name: String,
    val planned: BigDecimal?,
    val realized: BigDecimal,
    val percentUsed: Int?,
)

/** Orçamento de despesas do mês, com as categorias em destaque. */
data class ExpenseBudget(
    val planned: BigDecimal,
    val realized: BigDecimal,
    val percentUsed: Int?,
    val highlights: List<BudgetCategoryUsage>,
)

@Service
class BudgetOverview(private val budgetService: BudgetService) {

    fun expenses(month: YearMonth, highlights: Int): ExpenseBudget {
        val view = budgetService.view(month)
        return ExpenseBudget(
            planned = view.expense.planned,
            realized = view.expense.realized.total,
            percentUsed = view.expense.percentUsed,
            highlights = BudgetTree.highlights(view.lines, highlights).map {
                BudgetCategoryUsage(it.category.id, it.category.name, it.planned, it.realized.total, it.percentUsed)
            },
        )
    }
}
