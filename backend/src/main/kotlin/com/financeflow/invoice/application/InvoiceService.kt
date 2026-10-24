package com.financeflow.invoice.application

import com.financeflow.account.AccountDirectory
import com.financeflow.account.CardInfo
import com.financeflow.invoice.domain.Installments
import com.financeflow.invoice.domain.InvoiceCycle
import com.financeflow.invoice.domain.InvoiceStatus
import com.financeflow.invoice.infra.InvoiceEntity
import com.financeflow.invoice.infra.InvoiceRepository
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.security.CurrentUser
import com.financeflow.shared.time.Competence
import com.financeflow.shared.time.UserClock
import com.financeflow.transaction.CardItem
import com.financeflow.transaction.CardLedger
import com.financeflow.transaction.InvoiceTotal
import com.financeflow.transaction.NewCardItem
import com.financeflow.transaction.NewCardPurchase
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Clock
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

data class PurchaseCommand(
    val description: String,
    val amount: BigDecimal,
    val categoryId: UUID,
    val purchaseDate: LocalDate,
    val installments: Int,
)

/** Fatura com o total calculado dos itens (ADR-0009). Sem `id`, é a fatura atual que ainda não tem compras. */
data class InvoiceSummary(
    val id: UUID?,
    val cardId: UUID,
    val closingDate: LocalDate,
    val dueDate: LocalDate,
    val competenceMonth: YearMonth,
    val status: InvoiceStatus,
    val total: BigDecimal,
    val paidAmount: BigDecimal,
    val itemCount: Long,
)

data class InvoiceDetail(
    val summary: InvoiceSummary,
    val cardName: String,
    val items: List<CardItem>,
    val previousInvoiceId: UUID?,
    val nextInvoiceId: UUID?,
)

data class PurchaseItem(val id: UUID, val invoiceId: UUID, val amount: BigDecimal, val dueDate: LocalDate, val competenceMonth: YearMonth)

data class InvoicePreview(val closingDate: LocalDate, val dueDate: LocalDate, val competenceMonth: YearMonth)

/** Faturas por cartão e ciclo e as compras que caem nelas (RF-031, RF-032, RN-04, RN-05). */
@Service
class InvoiceService(
    private val invoices: InvoiceRepository,
    private val accounts: AccountDirectory,
    private val cardLedger: CardLedger,
    private val currentUser: CurrentUser,
    private val userClock: UserClock,
    private val clock: Clock,
) {

    /** A parcela k cai k − 1 faturas depois da fatura da data da compra, criando as que faltarem (ADR-0009). */
    @Transactional
    fun purchase(cardId: UUID, command: PurchaseCommand): List<PurchaseItem> {
        val card = findCard(cardId)
        if (card.archived) throw BusinessRuleException("CARD_ARCHIVED", "O cartão está arquivado")
        val closings = invoices.findByAccountIdOrderByClosingDate(card.id).map { it.closingDate }.toMutableSet()
        var reference = command.purchaseDate
        val parts = Installments.split(command.amount, command.installments)
        val drafts = parts.mapIndexed { index, amount ->
            val closing = InvoiceCycle.closingFor(reference, card.closingDay, closings)
            closings += closing
            reference = closing.plusDays(1)
            val invoice = getOrCreate(card, closing)
            NewCardItem(
                invoiceId = invoice.id,
                dueDate = invoice.dueDate,
                competence = YearMonth.from(invoice.competenceMonth),
                amount = amount,
                installmentNumber = (index + 1).takeIf { parts.size > 1 },
            )
        }
        val ids = cardLedger.record(
            NewCardPurchase(card.id, command.description, command.categoryId, command.purchaseDate, drafts),
        )
        return ids.zip(drafts) { id, item -> PurchaseItem(id, item.invoiceId, item.amount, item.dueDate, item.competence) }
    }

    /** Em que fatura cai uma compra feita nesta data, sem gravar nada. */
    @Transactional(readOnly = true)
    fun preview(cardId: UUID, purchaseDate: LocalDate): InvoicePreview {
        val card = findCard(cardId)
        val existing = invoices.findByAccountIdOrderByClosingDate(card.id)
        val closing = InvoiceCycle.closingFor(purchaseDate, card.closingDay, existing.map { it.closingDate })
        val invoice = existing.firstOrNull { it.closingDate == closing }
        val dueDate = invoice?.dueDate ?: InvoiceCycle.dueDate(closing, card.dueDay)
        val competence = invoice?.let { YearMonth.from(it.competenceMonth) } ?: Competence.suggest(dueDate, card.competenceOffset)
        return InvoicePreview(closing, dueDate, competence)
    }

    @Transactional(readOnly = true)
    fun list(cardId: UUID, from: LocalDate?, to: LocalDate?): List<InvoiceSummary> {
        val card = findCard(cardId)
        val found = invoices.findByAccountIdOrderByClosingDate(card.id)
            .filter { (from == null || !it.closingDate.isBefore(from)) && (to == null || !it.closingDate.isAfter(to)) }
        return summaries(found)
    }

    /** A fatura em que cai uma compra feita hoje, no fuso do usuário. */
    @Transactional(readOnly = true)
    fun current(cardId: UUID): InvoiceSummary {
        val card = findCard(cardId)
        val today = userClock.today(currentUser.id())
        val existing = invoices.findByAccountIdOrderByClosingDate(card.id)
        val closing = InvoiceCycle.closingFor(today, card.closingDay, existing.map { it.closingDate })
        existing.firstOrNull { it.closingDate == closing }?.let { return summaries(listOf(it)).single() }
        val preview = preview(card.id, today)
        return InvoiceSummary(
            id = null,
            cardId = card.id,
            closingDate = preview.closingDate,
            dueDate = preview.dueDate,
            competenceMonth = preview.competenceMonth,
            status = InvoiceStatus.OPEN,
            total = BigDecimal.ZERO,
            paidAmount = BigDecimal.ZERO,
            itemCount = 0,
        )
    }

    @Transactional(readOnly = true)
    fun get(id: UUID): InvoiceDetail {
        val invoice = invoices.findForUser(id, currentUser.id()) ?: throw NotFoundException()
        val card = findCard(invoice.accountId)
        val all = invoices.findByAccountIdOrderByClosingDate(card.id)
        val index = all.indexOfFirst { it.id == invoice.id }
        return InvoiceDetail(
            summary = summaries(listOf(invoice)).single(),
            cardName = card.name,
            items = cardLedger.items(invoice.id),
            previousInvoiceId = all.getOrNull(index - 1)?.id,
            nextInvoiceId = all.getOrNull(index + 1)?.id,
        )
    }

    /** Exclui a compra com todas as parcelas; fatura que fica vazia e sem pagamento deixa de existir. */
    @Transactional
    fun deletePurchase(itemId: UUID) {
        val purchase = cardLedger.purchase(itemId) ?: throw NotFoundException()
        cardLedger.deletePurchase(itemId)
        val remaining = cardLedger.totals(purchase.invoiceIds)
        val empty = invoices.findAllById(purchase.invoiceIds)
            .filter { it.id !in remaining && it.paidAmount.signum() == 0 }
        invoices.deleteAll(empty)
    }

    private fun findCard(cardId: UUID): CardInfo = accounts.findCard(cardId) ?: throw NotFoundException()

    private fun getOrCreate(card: CardInfo, closing: LocalDate): InvoiceEntity {
        invoices.findByAccountIdAndClosingDate(card.id, closing)?.let { return it }
        val dueDate = InvoiceCycle.dueDate(closing, card.dueDay)
        // ADR-0008: a competência da fatura é o mês do vencimento menos o deslocamento do cartão
        val competence = Competence.suggest(dueDate, card.competenceOffset).atDay(1)
        invoices.insertIfAbsent(UUID.randomUUID(), card.id, closing, dueDate, competence, clock.instant())
        return checkNotNull(invoices.findByAccountIdAndClosingDate(card.id, closing))
    }

    private fun summaries(found: List<InvoiceEntity>): List<InvoiceSummary> {
        if (found.isEmpty()) return emptyList()
        val today = userClock.today(currentUser.id())
        val totals = cardLedger.totals(found.map { it.id })
        return found.map { it.toSummary(totals[it.id], today) }
    }

    private fun InvoiceEntity.toSummary(total: InvoiceTotal?, today: LocalDate) = InvoiceSummary(
        id = id,
        cardId = accountId,
        closingDate = closingDate,
        dueDate = dueDate,
        competenceMonth = YearMonth.from(competenceMonth),
        status = InvoiceStatus.of(status, closingDate, today),
        total = total?.total ?: BigDecimal.ZERO,
        paidAmount = paidAmount,
        itemCount = total?.itemCount ?: 0,
    )
}
