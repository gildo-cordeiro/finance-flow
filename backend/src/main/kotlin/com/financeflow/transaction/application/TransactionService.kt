package com.financeflow.transaction.application

import com.financeflow.account.AccountDirectory
import com.financeflow.account.AccountInfo
import com.financeflow.category.CategoryDirectory
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.FieldError
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.error.ValidationException
import com.financeflow.shared.security.CurrentUser
import com.financeflow.shared.time.UserClock
import com.financeflow.transaction.domain.CategoryTotal
import com.financeflow.transaction.domain.Competence
import com.financeflow.transaction.domain.Entry
import com.financeflow.transaction.domain.MonthTotals
import com.financeflow.transaction.domain.Payable
import com.financeflow.transaction.domain.TransactionFilter
import com.financeflow.transaction.domain.TransactionStatus
import com.financeflow.transaction.domain.TransactionTotals
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

data class SaveTransactionCommand(
    val type: TransactionType,
    val description: String,
    val amount: BigDecimal,
    val accountId: UUID,
    val categoryId: UUID,
    val competenceMonth: YearMonth?,
    val dueDate: LocalDate?,
    val paymentDate: LocalDate?,
    val status: TransactionStatus?,
    val visibility: Visibility,
)

data class TransactionPage(
    val items: List<TransactionView>,
    val page: Int,
    val size: Int,
    val totals: TransactionTotals,
)

/** Receitas e despesas em conta corrente e poupança (RF-020 a RF-022). */
@Service
class TransactionService(
    private val transactions: TransactionRepository,
    private val accounts: AccountDirectory,
    private val categories: CategoryDirectory,
    private val currentUser: CurrentUser,
    private val userClock: UserClock,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun list(filter: TransactionFilter, page: Int, size: Int): TransactionPage {
        val userId = currentUser.id()
        val items = transactions.search(userId, filter, size, page.toLong() * size)
        return TransactionPage(items, page, size, transactions.totals(userId, filter))
    }

    /** Realizado da competência por categoria: todos os status, sem transferências (RN-02, RN-07). */
    @Transactional(readOnly = true)
    fun totalsByCategory(month: YearMonth): List<CategoryTotal> =
        transactions.totalsByCategory(currentUser.id(), month.atDay(1))

    @Transactional(readOnly = true)
    fun monthTotals(month: YearMonth): MonthTotals = transactions.monthTotals(currentUser.id(), month.atDay(1))

    /** Despesas atrasadas e as que vencem até `days` dias a partir de hoje, no fuso do usuário. */
    @Transactional(readOnly = true)
    fun payables(days: Long, limit: Int): Pair<List<Payable>, Long> {
        val userId = currentUser.id()
        val today = userClock.today(userId)
        return transactions.payables(userId, today, today.plusDays(days), limit) to transactions.countOverdue(userId, today)
    }

    @Transactional(readOnly = true)
    fun get(id: UUID): TransactionView = transactions.findView(currentUser.id(), id) ?: throw NotFoundException()

    @Transactional(readOnly = true)
    fun suggestCompetence(accountId: UUID, referenceDate: LocalDate): YearMonth {
        val account = accounts.find(accountId) ?: throw NotFoundException()
        return Competence.suggest(referenceDate, account.competenceOffset)
    }

    @Transactional
    fun create(command: SaveTransactionCommand): TransactionView {
        val userId = currentUser.id()
        val entry = validEntry(userId, command, current = null)
        val transaction = TransactionEntity(
            id = UUID.randomUUID(),
            userId = userId,
            accountId = command.accountId,
            categoryId = command.categoryId,
            description = command.description.trim(),
            amount = entry.amount,
            type = entry.type,
            status = entry.status,
            competenceDate = entry.competence.atDay(1),
            dueDate = entry.dueDate,
            paymentDate = entry.paymentDate,
            visibility = command.visibility,
            createdBy = userId,
            updatedBy = userId,
            updatedAt = clock.instant(),
        )
        transactions.saveAndFlush(transaction)
        return get(transaction.id)
    }

    @Transactional
    fun update(id: UUID, command: SaveTransactionCommand): TransactionView {
        val userId = currentUser.id()
        val transaction = findEditable(userId, id)
        val entry = validEntry(userId, command, transaction)
        transaction.accountId = command.accountId
        transaction.categoryId = command.categoryId
        transaction.description = command.description.trim()
        transaction.visibility = command.visibility
        return save(userId, transaction, entry)
    }

    @Transactional
    fun delete(id: UUID) {
        val transaction = findEditable(currentUser.id(), id)
        transactions.delete(transaction)
    }

    /** Atalho de status: pago na data informada, ou hoje no fuso do usuário. */
    @Transactional
    fun pay(id: UUID, paymentDate: LocalDate?): TransactionView {
        val userId = currentUser.id()
        val transaction = findEditable(userId, id)
        return save(userId, transaction, transaction.toEntry().paid(paymentDate ?: userClock.today(userId)))
    }

    @Transactional
    fun unpay(id: UUID): TransactionView {
        val userId = currentUser.id()
        val transaction = findEditable(userId, id)
        return save(userId, transaction, transaction.toEntry().unpaid(userClock.today(userId)))
    }

    private fun validEntry(userId: UUID, command: SaveTransactionCommand, current: TransactionEntity?): Entry {
        val account = validAccount(command.accountId, current)
        val category = categories.find(command.categoryId)
            ?: throw ValidationException("categoryId", "Categoria não encontrada")
        if (category.archived && command.categoryId != current?.categoryId) {
            throw ValidationException("categoryId", "Categoria arquivada")
        }
        if (command.type != TransactionType.TRANSFER && category.income != (command.type == TransactionType.INCOME)) {
            val expected = if (category.income) "receita" else "despesa"
            throw ValidationException("categoryId", "A categoria é de $expected")
        }
        return Entry.of(
            type = command.type,
            amount = command.amount,
            informedCompetence = command.competenceMonth,
            dueDate = command.dueDate,
            paymentDate = command.paymentDate,
            requestedStatus = command.status,
            competenceOffset = account.competenceOffset,
            today = userClock.today(userId),
        )
    }

    private fun save(userId: UUID, transaction: TransactionEntity, entry: Entry): TransactionView {
        transaction.type = entry.type
        transaction.amount = entry.amount
        transaction.status = entry.status
        transaction.competenceDate = entry.competence.atDay(1)
        transaction.dueDate = entry.dueDate
        transaction.paymentDate = entry.paymentDate
        transaction.updatedBy = userId
        transaction.updatedAt = clock.instant()
        transactions.flush()
        return get(transaction.id)
    }

    private fun TransactionEntity.toEntry() =
        Entry(type, amount, YearMonth.from(competenceDate), dueDate, paymentDate, status)

    private fun validAccount(accountId: UUID, current: TransactionEntity?): AccountInfo {
        val account = accounts.find(accountId) ?: throw ValidationException("accountId", "Conta não encontrada")
        if (account.creditCard) {
            throw ValidationException(
                listOf(FieldError("accountId", "Compras no cartão têm cadastro próprio")),
                code = "USE_CARD_ENDPOINT",
            )
        }
        if (account.archived && accountId != current?.accountId) {
            throw ValidationException("accountId", "Conta arquivada")
        }
        return account
    }

    /** Parcelas, transferências e itens de fatura são alterados pelos fluxos próprios (F1-12 a F1-14). */
    private fun findEditable(userId: UUID, id: UUID): TransactionEntity {
        val transaction = transactions.findByIdAndUserId(id, userId) ?: throw NotFoundException()
        val reason = when {
            transaction.transferGroupId != null -> "Transferências são alteradas pela tela de transferência"
            transaction.installmentGroupId != null -> "Parcelas são alteradas com a escolha do alcance"
            transaction.invoiceId != null -> "Compras no cartão são alteradas pela fatura"
            else -> null
        }
        reason?.let { throw BusinessRuleException("TRANSACTION_NOT_EDITABLE_HERE", it) }
        return transaction
    }
}
