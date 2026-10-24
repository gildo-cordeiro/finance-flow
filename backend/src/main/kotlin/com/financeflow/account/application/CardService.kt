package com.financeflow.account.application

import com.financeflow.account.domain.AccountType
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

data class Card(
    val id: UUID,
    val name: String,
    val brand: String?,
    val creditLimit: BigDecimal,
    val closingDay: Int,
    val dueDay: Int,
    val competenceOffset: Int,
    val defaultPaymentAccountId: UUID?,
    val archived: Boolean,
)

data class SaveCardCommand(
    val name: String,
    val brand: String?,
    val creditLimit: BigDecimal,
    val closingDay: Int,
    val dueDay: Int,
    val competenceOffset: Int,
    val defaultPaymentAccountId: UUID?,
)

/**
 * Cartões de crédito (RF-030). O cartão é uma conta `CREDIT_CARD`; fechamento e vencimento decidem a fatura.
 * Mudar o dia de fechamento vale a partir do próximo ciclo: a fatura já criada mantém a data dela (ADR-0009).
 */
@Service
class CardService(
    private val accounts: AccountRepository,
    private val currentUser: CurrentUser,
    private val clock: Clock,
) {

    private val byName = Collator.getInstance(Locale.of("pt", "BR"))

    @Transactional(readOnly = true)
    fun list(includeArchived: Boolean): List<Card> = accounts.findByUserId(currentUser.id())
        .filter { it.type == AccountType.CREDIT_CARD && (includeArchived || !it.archived) }
        .sortedWith(compareBy(byName) { it.name })
        .map { it.toCard() }

    @Transactional(readOnly = true)
    fun get(id: UUID): Card = find(id).toCard()

    @Transactional(readOnly = true)
    fun lookup(id: UUID): Card? = accounts.findByIdAndUserId(id, currentUser.id())
        ?.takeIf { it.type == AccountType.CREDIT_CARD }
        ?.toCard()

    @Transactional
    fun create(command: SaveCardCommand): Card {
        val userId = currentUser.id()
        validPaymentAccount(userId, command.defaultPaymentAccountId)
        val card = AccountEntity(
            id = UUID.randomUUID(),
            userId = userId,
            name = command.name.trim(),
            type = AccountType.CREDIT_CARD,
            bank = null,
            initialBalance = BigDecimal.ZERO,
            competenceOffset = command.competenceOffset.toShort(),
            updatedAt = clock.instant(),
        )
        card.apply(command)
        accounts.save(card)
        return card.toCard()
    }

    @Transactional
    fun update(id: UUID, command: SaveCardCommand): Card {
        val card = find(id)
        validPaymentAccount(card.userId, command.defaultPaymentAccountId)
        card.name = command.name.trim()
        card.competenceOffset = command.competenceOffset.toShort()
        card.apply(command)
        card.updatedAt = clock.instant()
        return card.toCard()
    }

    @Transactional
    fun setArchived(id: UUID, archived: Boolean): Card {
        val card = find(id)
        if (card.archived != archived) {
            card.archived = archived
            card.updatedAt = clock.instant()
        }
        return card.toCard()
    }

    @Transactional
    fun delete(id: UUID) {
        val card = find(id)
        if (accounts.hasTransactions(card.id)) throw cardInUse()
        try {
            accounts.delete(card)
            accounts.flush()
        } catch (ex: DataIntegrityViolationException) {
            throw cardInUse()
        }
    }

    private fun find(id: UUID): AccountEntity = accounts.findByIdAndUserId(id, currentUser.id())
        ?.takeIf { it.type == AccountType.CREDIT_CARD }
        ?: throw NotFoundException()

    private fun validPaymentAccount(userId: UUID, accountId: UUID?) {
        if (accountId == null) return
        val account = accounts.findByIdAndUserId(accountId, userId)
        val error = when {
            account == null -> "Conta não encontrada"
            !account.type.isBankAccount -> "A fatura é paga por uma conta corrente ou poupança"
            account.archived -> "Conta arquivada"
            else -> null
        }
        error?.let { throw ValidationException("defaultPaymentAccountId", it) }
    }

    private fun AccountEntity.apply(command: SaveCardCommand) {
        brand = command.brand?.trim()?.takeIf { it.isNotEmpty() }
        creditLimit = command.creditLimit
        closingDay = command.closingDay.toShort()
        dueDay = command.dueDay.toShort()
        defaultPaymentAccountId = command.defaultPaymentAccountId
    }

    private fun AccountEntity.toCard() = Card(
        id = id,
        name = name,
        brand = brand,
        creditLimit = creditLimit ?: BigDecimal.ZERO,
        closingDay = checkNotNull(closingDay).toInt(),
        dueDay = checkNotNull(dueDay).toInt(),
        competenceOffset = competenceOffset.toInt(),
        defaultPaymentAccountId = defaultPaymentAccountId,
        archived = archived,
    )

    private fun cardInUse() =
        BusinessRuleException("ACCOUNT_IN_USE", "O cartão tem compras. Arquive-o em vez de excluir")
}
