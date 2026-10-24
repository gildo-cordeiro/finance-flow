package com.financeflow.budget.domain

import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

data class BudgetCategory(
    val id: UUID,
    val name: String,
    val income: Boolean,
    val archived: Boolean,
    val parentId: UUID?,
)

data class Realized(val total: BigDecimal, val paid: BigDecimal) {
    operator fun plus(other: Realized) = Realized(total + other.total, paid + other.paid)

    companion object {
        val ZERO = Realized(BigDecimal.ZERO, BigDecimal.ZERO)
    }
}

/**
 * Linha do orçamento de uma categoria. Na categoria mãe, o planejado é o valor direto dela somado ao das
 * subcategorias, e o realizado também inclui o das subcategorias (F1-17). Sem nada planejado, `planned` é nulo.
 */
data class BudgetLine(
    val category: BudgetCategory,
    val directPlanned: BigDecimal?,
    val planned: BigDecimal?,
    val realized: Realized,
    val children: List<BudgetLine>,
) {
    val remaining: BigDecimal? get() = planned?.minus(realized.total)

    val percentUsed: Int? get() = percent(realized.total, planned)

    val hasActivity: Boolean get() = planned != null || realized.total.signum() != 0
}

data class BudgetTotals(val planned: BigDecimal, val realized: Realized) {
    val remaining: BigDecimal get() = planned - realized.total

    val percentUsed: Int? get() = percent(realized.total, planned)
}

private val HUNDRED = BigDecimal(100)

private fun percent(value: BigDecimal, of: BigDecimal?): Int? = of?.takeIf { it.signum() > 0 }?.let {
    value.multiply(HUNDRED).divide(it, 0, RoundingMode.HALF_UP).toInt()
}

object BudgetTree {

    /**
     * Monta as linhas na ordem recebida (mães seguidas das filhas). Categorias arquivadas só aparecem quando têm
     * planejado ou realizado no mês, para o total bater com as transações.
     */
    fun build(
        categories: List<BudgetCategory>,
        planned: Map<UUID, BigDecimal>,
        realized: Map<UUID, Realized>,
    ): List<BudgetLine> {
        val children = categories.filter { it.parentId != null }.groupBy { it.parentId }
        return categories.filter { it.parentId == null }.mapNotNull { parent ->
            val childLines = children[parent.id].orEmpty()
                .map { leaf(it, planned, realized) }
                .filter { !it.category.archived || it.hasActivity }
            val own = leaf(parent, planned, realized)
            val line = own.copy(
                planned = sum(listOf(own.directPlanned) + childLines.map { it.directPlanned }),
                realized = childLines.fold(own.realized) { acc, child -> acc + child.realized },
                children = childLines,
            )
            line.takeIf { !parent.archived || it.hasActivity }
        }
    }

    fun totals(lines: List<BudgetLine>, income: Boolean): BudgetTotals {
        val ofType = lines.filter { it.category.income == income }
        return BudgetTotals(
            planned = ofType.fold(BigDecimal.ZERO) { acc, line -> acc + (line.planned ?: BigDecimal.ZERO) },
            realized = ofType.fold(Realized.ZERO) { acc, line -> acc + line.realized },
        )
    }

    private fun leaf(category: BudgetCategory, planned: Map<UUID, BigDecimal>, realized: Map<UUID, Realized>) =
        BudgetLine(
            category = category,
            directPlanned = planned[category.id],
            planned = planned[category.id],
            realized = realized[category.id] ?: Realized.ZERO,
            children = emptyList(),
        )

    private fun sum(values: List<BigDecimal?>): BigDecimal? =
        values.filterNotNull().takeIf { it.isNotEmpty() }?.fold(BigDecimal.ZERO, BigDecimal::add)
}
