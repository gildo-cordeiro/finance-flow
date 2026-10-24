package com.financeflow.account.application

import com.financeflow.account.domain.AccountType
import com.financeflow.account.domain.Balance
import com.financeflow.account.domain.PaidTotals
import com.financeflow.account.infra.AccountEntity
import com.financeflow.account.infra.AccountRepository
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.error.ValidationException
import com.financeflow.shared.security.CurrentUser
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.text.Collator
import java.time.Clock
import java.util.Locale
import java.util.UUID

data class Account(
    val id: UUID,
    val name: String,
    val type: AccountType,
    val bank: String?,
    val initialBalance: BigDecimal,
    val competenceOffset: Int,
    val archived: Boolean,
    val balance: BigDecimal,
)

data class SaveAccountCommand(
    val name: String,
    val type: AccountType,
    val bank: String?,
    val initialBalance: BigDecimal,
    val competenceOffset: Int,
)

/** Saldo somado das contas correntes e poupanças ativas (ADR-0011). */
data class AccountsSummary(val balance: BigDecimal, val accountCount: Int)

/** Contas corrente e poupança (RF-010, RF-011). Cartões têm cadastro próprio (F1-14). */
@Service
class AccountService(
    private val accounts: AccountRepository,
    private val currentUser: CurrentUser,
    private val clock: Clock,
) {

    private val byName = Collator.getInstance(Locale.of("pt", "BR"))

    @Transactional(readOnly = true)
    fun list(includeArchived: Boolean): List<Account> {
        val userId = currentUser.id()
        val found = accounts.findByUserId(userId)
            .filter { includeArchived || !it.archived }
            .sortedWith(compareBy(byName) { it.name })
        return withBalances(userId, found)
    }

    @Transactional(readOnly = true)
    fun summary(): AccountsSummary {
        val active = list(includeArchived = false).filter { it.type.isBankAccount }
        return AccountsSummary(active.fold(BigDecimal.ZERO) { acc, it -> acc + it.balance }, active.size)
    }

    @Transactional(readOnly = true)
    fun get(id: UUID): Account = find(id).let { withBalances(it.userId, listOf(it)).single() }

    @Transactional(readOnly = true)
    fun lookup(id: UUID): Account? =
        accounts.findByIdAndUserId(id, currentUser.id())?.let { withBalances(it.userId, listOf(it)).single() }

    @Transactional
    fun create(command: SaveAccountCommand): Account {
        requireBankAccount(command.type)
        val account = AccountEntity(
            id = UUID.randomUUID(),
            userId = currentUser.id(),
            name = command.name.trim(),
            type = command.type,
            bank = command.bank.normalized(),
            initialBalance = command.initialBalance,
            competenceOffset = command.competenceOffset.toShort(),
            updatedAt = clock.instant(),
        )
        accounts.save(account)
        return account.toAccount(paid = null)
    }

    @Transactional
    fun update(id: UUID, command: SaveAccountCommand): Account {
        requireBankAccount(command.type)
        val account = findBankAccount(id)
        account.name = command.name.trim()
        account.type = command.type
        account.bank = command.bank.normalized()
        account.initialBalance = command.initialBalance
        account.competenceOffset = command.competenceOffset.toShort()
        account.updatedAt = clock.instant()
        return withBalances(account.userId, listOf(account)).single()
    }

    /** Conta arquivada some dos formulários, mas o histórico continua (RF-011). */
    @Transactional
    fun setArchived(id: UUID, archived: Boolean): Account {
        val account = findBankAccount(id)
        if (account.archived != archived) {
            account.archived = archived
            account.updatedAt = clock.instant()
        }
        return withBalances(account.userId, listOf(account)).single()
    }

    @Transactional
    fun delete(id: UUID) {
        val account = findBankAccount(id)
        if (accounts.hasTransactions(account.id)) throw accountInUse()
        try {
            accounts.delete(account)
            accounts.flush()
        } catch (ex: DataIntegrityViolationException) {
            throw accountInUse()
        }
    }

    private fun find(id: UUID) = accounts.findByIdAndUserId(id, currentUser.id()) ?: throw NotFoundException()

    private fun findBankAccount(id: UUID): AccountEntity {
        val account = find(id)
        if (!account.type.isBankAccount) {
            throw BusinessRuleException("ACCOUNT_IS_CREDIT_CARD", "Cartões de crédito são alterados no cadastro de cartões")
        }
        return account
    }

    private fun requireBankAccount(type: AccountType) {
        if (!type.isBankAccount) throw ValidationException("type", "Use o cadastro de cartões para cartão de crédito")
    }

    private fun withBalances(userId: UUID, found: List<AccountEntity>): List<Account> {
        if (found.isEmpty()) return emptyList()
        val totals = accounts.paidTotals(userId, found.map { it.id }).associateBy { it.accountId }
        return found.map { it.toAccount(totals[it.id]) }
    }

    private fun AccountEntity.toAccount(paid: PaidTotals?) = Account(
        id = id,
        name = name,
        type = type,
        bank = bank,
        initialBalance = initialBalance,
        competenceOffset = competenceOffset.toInt(),
        archived = archived,
        balance = Balance.of(initialBalance, paid),
    )

    private fun String?.normalized() = this?.trim()?.takeIf { it.isNotEmpty() }

    private fun accountInUse() =
        BusinessRuleException("ACCOUNT_IN_USE", "A conta tem transações. Arquive-a em vez de excluir")
}
