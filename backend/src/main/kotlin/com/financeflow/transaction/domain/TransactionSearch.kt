package com.financeflow.transaction.domain

import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/** Filtros combináveis da listagem (RF-021). Nulo ou vazio = sem filtro. */
data class TransactionFilter(
    val from: LocalDate,
    val to: LocalDate,
    val dateField: DateField = DateField.COMPETENCE,
    val accountId: UUID? = null,
    val categoryId: UUID? = null,
    val statuses: Set<TransactionStatus> = emptySet(),
    val type: TransactionType? = null,
    val text: String? = null,
)

data class TransactionView(
    val id: UUID,
    val type: TransactionType,
    val description: String,
    val amount: BigDecimal,
    val accountId: UUID,
    val accountName: String,
    val categoryId: UUID?,
    val categoryName: String?,
    val parentCategoryName: String?,
    val competenceDate: LocalDate,
    val dueDate: LocalDate?,
    val paymentDate: LocalDate?,
    val status: TransactionStatus,
    val visibility: Visibility,
    val installmentNumber: Int?,
    val totalInstallments: Int?,
    val transferGroupId: UUID?,
    val transferDirection: String?,
    val recurring: Boolean,
)

/** Totais da seleção inteira, não só da página. Transferências ficam de fora (RF-013). */
data class TransactionTotals(val count: Long, val income: BigDecimal, val expense: BigDecimal) {
    val balance: BigDecimal get() = income - expense
}
