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

/** Soma da competência numa categoria, de todos os status, e quanto dela já foi pago. */
data class CategoryTotal(val categoryId: UUID, val total: BigDecimal, val paid: BigDecimal)

/** Receitas e despesas da competência, com quanto de cada uma já foi pago. Transferências ficam de fora (RF-013). */
data class MonthTotals(
    val income: BigDecimal,
    val incomePaid: BigDecimal,
    val expense: BigDecimal,
    val expensePaid: BigDecimal,
)

/**
 * Despesa não paga com vencimento, fora do cartão (a compra no cartão se paga pela fatura). `overdue` vale pelo
 * "hoje" do usuário, não pelo status gravado (RN-06).
 */
data class Payable(
    val id: UUID,
    val description: String,
    val amount: BigDecimal,
    val accountName: String,
    val categoryName: String?,
    val dueDate: LocalDate,
    val overdue: Boolean,
)
