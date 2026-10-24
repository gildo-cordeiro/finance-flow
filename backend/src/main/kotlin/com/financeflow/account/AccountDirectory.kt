package com.financeflow.account

import com.financeflow.account.application.AccountService
import com.financeflow.account.application.CardService
import com.financeflow.account.domain.AccountType
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.util.UUID

/** O que outros módulos sabem de uma conta do usuário autenticado. */
data class AccountInfo(
    val id: UUID,
    val name: String,
    val creditCard: Boolean,
    val archived: Boolean,
    val competenceOffset: Int,
)

/** Conta corrente ou poupança ativa, com o saldo de hoje (ADR-0011). */
data class AccountBalance(val id: UUID, val name: String, val savings: Boolean, val balance: BigDecimal)

/** Cartão do usuário autenticado, com o que decide a fatura de uma compra (RN-04, ADR-0008). */
data class CardInfo(
    val id: UUID,
    val name: String,
    val closingDay: Int,
    val dueDay: Int,
    val competenceOffset: Int,
    val archived: Boolean,
)

@Service
class AccountDirectory(private val accountService: AccountService, private val cardService: CardService) {

    /** Nulo quando a conta não existe ou é de outro usuário (ADR-0012). */
    fun find(id: UUID): AccountInfo? = accountService.lookup(id)?.let {
        AccountInfo(it.id, it.name, !it.type.isBankAccount, it.archived, it.competenceOffset)
    }

    /** Nulo quando o cartão não existe, é de outro usuário ou a conta não é cartão (ADR-0012). */
    fun findCard(id: UUID): CardInfo? = cardService.lookup(id)?.let {
        CardInfo(it.id, it.name, it.closingDay, it.dueDay, it.competenceOffset, it.archived)
    }

    /** Contas correntes e poupanças não arquivadas, em ordem alfabética. */
    fun balances(): List<AccountBalance> = accountService.list(includeArchived = false)
        .filter { it.type.isBankAccount }
        .map { AccountBalance(it.id, it.name, it.type == AccountType.SAVINGS, it.balance) }
}
