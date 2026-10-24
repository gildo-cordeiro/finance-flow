package com.financeflow.transaction

import com.financeflow.transaction.application.TransactionService
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.YearMonth
import java.util.UUID

/** Quanto o usuário autenticado lançou numa categoria na competência, e quanto disso já foi pago. */
data class CategoryRealized(val categoryId: UUID, val realized: BigDecimal, val realizedPaid: BigDecimal)

@Service
class TransactionLedger(private val transactionService: TransactionService) {

    /** Todos os status contam, porque a competência diz a que mês o gasto pertence; transferências não (RF-013). */
    fun realizedByCategory(month: YearMonth): List<CategoryRealized> =
        transactionService.totalsByCategory(month).map { CategoryRealized(it.categoryId, it.total, it.paid) }
}
