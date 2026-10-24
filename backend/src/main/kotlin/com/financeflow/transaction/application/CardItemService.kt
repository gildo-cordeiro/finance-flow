package com.financeflow.transaction.application

import com.financeflow.category.CategoryDirectory
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.error.ValidationException
import com.financeflow.shared.security.CurrentUser
import com.financeflow.shared.time.UserClock
import com.financeflow.transaction.domain.InvoiceItemsTotal
import com.financeflow.transaction.domain.TransactionStatus
import com.financeflow.transaction.domain.TransactionStatusPolicy
import com.financeflow.transaction.domain.TransactionType
import com.financeflow.transaction.domain.TransactionView
import com.financeflow.transaction.domain.Visibility
import com.financeflow.transaction.infra.TransactionEntity
import com.financeflow.transaction.infra.TransactionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Clock
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

data class CardItemCommand(
    val invoiceId: UUID,
    val dueDate: LocalDate,
    val competence: YearMonth,
    val amount: BigDecimal,
    val installmentNumber: Int?,
)

data class CardPurchaseCommand(
    val cardId: UUID,
    val description: String,
    val categoryId: UUID,
    val purchaseDate: LocalDate,
    val items: List<CardItemCommand>,
)

data class CardPaymentCommand(
    val paymentId: UUID,
    val fromAccountId: UUID,
    val cardId: UUID,
    val amount: BigDecimal,
    val paymentDate: LocalDate,
    val description: String,
)

/** Uma compra no cartão, com a parcela de cada item quando for parcelada. */
data class CardPurchaseRef(val cardId: UUID, val invoiceIds: Set<UUID>, val itemIds: List<UUID>, val anyPaid: Boolean)

/**
 * Itens de fatura: compras no cartão, à vista ou parceladas (RF-031, RN-05). A fatura de cada item é escolhida
 * pelo módulo `invoice`; aqui ficam a categoria, o status e a gravação.
 */
@Service
class CardItemService(
    private val transactions: TransactionRepository,
    private val categories: CategoryDirectory,
    private val currentUser: CurrentUser,
    private val userClock: UserClock,
    private val clock: Clock,
) {

    @Transactional
    fun record(command: CardPurchaseCommand): List<UUID> {
        val userId = currentUser.id()
        val category = categories.find(command.categoryId)
            ?: throw ValidationException("categoryId", "Categoria não encontrada")
        if (category.archived) throw ValidationException("categoryId", "Categoria arquivada")
        if (category.income) throw ValidationException("categoryId", "A categoria é de receita")
        val today = userClock.today(userId)
        val group = if (command.items.size > 1) UUID.randomUUID() else null
        val entities = command.items.map { item ->
            TransactionEntity(
                id = UUID.randomUUID(),
                userId = userId,
                accountId = command.cardId,
                categoryId = command.categoryId,
                description = command.description.trim(),
                amount = item.amount,
                type = TransactionType.EXPENSE,
                // A dívida já foi assumida; vira atrasada se a fatura vencer sem pagamento (RN-06)
                status = TransactionStatusPolicy.resolve(TransactionStatus.PENDING, null, item.dueDate, today),
                competenceDate = item.competence.atDay(1),
                competenceInformed = false,
                dueDate = item.dueDate,
                paymentDate = null,
                visibility = Visibility.PRIVATE,
                createdBy = userId,
                updatedBy = userId,
                updatedAt = clock.instant(),
                installmentGroupId = group,
                installmentNumber = group?.let { item.installmentNumber?.toShort() },
                totalInstallments = group?.let { command.items.size.toShort() },
                invoiceId = item.invoiceId,
                purchaseDate = command.purchaseDate,
            )
        }
        transactions.saveAllAndFlush(entities)
        return entities.map { it.id }
    }

    @Transactional(readOnly = true)
    fun items(invoiceId: UUID): List<TransactionView> = transactions.findByInvoice(currentUser.id(), invoiceId)

    @Transactional(readOnly = true)
    fun totals(invoiceIds: Collection<UUID>): List<InvoiceItemsTotal> =
        transactions.invoiceTotals(currentUser.id(), invoiceIds)

    @Transactional(readOnly = true)
    fun purchase(itemId: UUID): CardPurchaseRef? {
        val items = purchaseItems(currentUser.id(), itemId) ?: return null
        return CardPurchaseRef(
            cardId = items.first().accountId,
            invoiceIds = items.mapNotNull { it.invoiceId }.toSet(),
            itemIds = items.map { it.id },
            anyPaid = items.any { it.status == TransactionStatus.PAID },
        )
    }

    /** Exclui a compra inteira, com todas as parcelas. Item pago é histórico e não sai (RN-01). */
    @Transactional
    fun deletePurchase(itemId: UUID) {
        val items = purchaseItems(currentUser.id(), itemId) ?: throw NotFoundException()
        if (items.any { it.status == TransactionStatus.PAID }) {
            throw BusinessRuleException("PURCHASE_HAS_PAID_ITEMS", "A compra tem parcelas pagas e não pode ser excluída")
        }
        transactions.deleteAll(items)
        transactions.flush()
    }

    /** As duas pontas do pagamento da fatura, já pagas; transferência não entra no orçamento (ADR-0039). */
    @Transactional
    fun recordPayment(command: CardPaymentCommand) {
        val userId = currentUser.id()
        val legs = listOf(command.fromAccountId to "OUT", command.cardId to "IN").map { (accountId, direction) ->
            TransactionEntity(
                id = UUID.randomUUID(),
                userId = userId,
                accountId = accountId,
                categoryId = null,
                description = command.description,
                amount = command.amount,
                type = TransactionType.TRANSFER,
                status = TransactionStatus.PAID,
                competenceDate = YearMonth.from(command.paymentDate).atDay(1),
                competenceInformed = false,
                dueDate = null,
                paymentDate = command.paymentDate,
                visibility = Visibility.PRIVATE,
                createdBy = userId,
                updatedBy = userId,
                updatedAt = clock.instant(),
                transferGroupId = command.paymentId,
                transferDirection = direction,
            )
        }
        transactions.saveAllAndFlush(legs)
    }

    @Transactional
    fun deletePayment(paymentId: UUID) {
        transactions.deleteAll(transactions.findByTransferGroupIdAndUserId(paymentId, currentUser.id()))
        transactions.flush()
    }

    /** Fatura quitada: os itens em aberto ficam pagos na data do pagamento que a quitou (RN-01). */
    @Transactional
    fun settle(invoiceId: UUID, paymentDate: LocalDate) {
        val userId = currentUser.id()
        transactions.findByInvoiceIdAndUserId(invoiceId, userId).filter { it.status != TransactionStatus.PAID }.forEach {
            it.status = TransactionStatus.PAID
            it.paymentDate = paymentDate
            it.updatedBy = userId
            it.updatedAt = clock.instant()
        }
    }

    /** Fatura que deixou de estar quitada: os itens voltam a pendentes ou atrasados pelo vencimento (RN-06). */
    @Transactional
    fun reopen(invoiceId: UUID) {
        val userId = currentUser.id()
        val today = userClock.today(userId)
        transactions.findByInvoiceIdAndUserId(invoiceId, userId).filter { it.status == TransactionStatus.PAID }.forEach {
            it.status = TransactionStatusPolicy.resolve(TransactionStatus.PENDING, null, it.dueDate, today)
            it.paymentDate = null
            it.updatedBy = userId
            it.updatedAt = clock.instant()
        }
    }

    private fun purchaseItems(userId: UUID, itemId: UUID): List<TransactionEntity>? {
        val item = transactions.findByIdAndUserId(itemId, userId)?.takeIf { it.invoiceId != null } ?: return null
        return item.installmentGroupId?.let { transactions.findByInstallmentGroupIdAndUserId(it, userId) } ?: listOf(item)
    }
}
