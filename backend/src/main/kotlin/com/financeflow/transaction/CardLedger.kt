package com.financeflow.transaction

import com.financeflow.transaction.application.CardItemCommand
import com.financeflow.transaction.application.CardItemService
import com.financeflow.transaction.application.CardPaymentCommand
import com.financeflow.transaction.application.CardPurchaseCommand
import com.financeflow.transaction.domain.TransactionStatus
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

/** Um item da compra já com a fatura escolhida pelo módulo `invoice` (RN-04, RN-05). */
data class NewCardItem(
    val invoiceId: UUID,
    val dueDate: LocalDate,
    val competence: YearMonth,
    val amount: BigDecimal,
    val installmentNumber: Int?,
)

data class NewCardPurchase(
    val cardId: UUID,
    val description: String,
    val categoryId: UUID,
    val purchaseDate: LocalDate,
    val items: List<NewCardItem>,
)

data class CardItem(
    val id: UUID,
    val description: String,
    val amount: BigDecimal,
    val categoryId: UUID?,
    val categoryName: String?,
    val parentCategoryName: String?,
    val purchaseDate: LocalDate,
    val installmentNumber: Int?,
    val totalInstallments: Int?,
    val paid: Boolean,
    val recurring: Boolean,
)

data class InvoiceTotal(val total: BigDecimal, val itemCount: Long)

/** Pagamento de fatura: o `paymentId` vira o grupo das duas pontas da transferência (ADR-0039). */
data class NewCardPayment(
    val paymentId: UUID,
    val fromAccountId: UUID,
    val cardId: UUID,
    val amount: BigDecimal,
    val paymentDate: LocalDate,
    val description: String,
)

data class CardPurchase(val cardId: UUID, val invoiceIds: Set<UUID>, val itemIds: List<UUID>, val anyPaid: Boolean)

/** Compras no cartão do usuário autenticado, vistas pela fatura. */
@Service
class CardLedger(private val cardItems: CardItemService) {

    fun record(purchase: NewCardPurchase): List<UUID> = cardItems.record(
        CardPurchaseCommand(
            cardId = purchase.cardId,
            description = purchase.description,
            categoryId = purchase.categoryId,
            purchaseDate = purchase.purchaseDate,
            items = purchase.items.map {
                CardItemCommand(it.invoiceId, it.dueDate, it.competence, it.amount, it.installmentNumber)
            },
        ),
    )

    fun items(invoiceId: UUID): List<CardItem> = cardItems.items(invoiceId).map {
        CardItem(
            id = it.id,
            description = it.description,
            amount = it.amount,
            categoryId = it.categoryId,
            categoryName = it.categoryName,
            parentCategoryName = it.parentCategoryName,
            purchaseDate = checkNotNull(it.purchaseDate),
            installmentNumber = it.installmentNumber,
            totalInstallments = it.totalInstallments,
            paid = it.status == TransactionStatus.PAID,
            recurring = it.recurring,
        )
    }

    /** O total da fatura é calculado dos itens, não guardado (ADR-0009). Fatura sem itens fica de fora. */
    fun totals(invoiceIds: Collection<UUID>): Map<UUID, InvoiceTotal> =
        cardItems.totals(invoiceIds).associate { it.invoiceId to InvoiceTotal(it.total, it.count) }

    /** A compra inteira a que o item pertence; nulo se o item não existe, é de outro usuário ou não é de fatura. */
    fun purchase(itemId: UUID): CardPurchase? =
        cardItems.purchase(itemId)?.let { CardPurchase(it.cardId, it.invoiceIds, it.itemIds, it.anyPaid) }

    fun deletePurchase(itemId: UUID) = cardItems.deletePurchase(itemId)

    fun recordPayment(payment: NewCardPayment) = cardItems.recordPayment(
        CardPaymentCommand(
            payment.paymentId, payment.fromAccountId, payment.cardId, payment.amount, payment.paymentDate, payment.description,
        ),
    )

    fun deletePayment(paymentId: UUID) = cardItems.deletePayment(paymentId)

    fun settle(invoiceId: UUID, paymentDate: LocalDate) = cardItems.settle(invoiceId, paymentDate)

    fun reopen(invoiceId: UUID) = cardItems.reopen(invoiceId)
}
