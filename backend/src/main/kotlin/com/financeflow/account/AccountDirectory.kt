package com.financeflow.account

import com.financeflow.account.application.AccountService
import org.springframework.stereotype.Service
import java.util.UUID

/** O que outros módulos sabem de uma conta do usuário autenticado. */
data class AccountInfo(
    val id: UUID,
    val name: String,
    val creditCard: Boolean,
    val archived: Boolean,
    val competenceOffset: Int,
)

@Service
class AccountDirectory(private val accountService: AccountService) {

    /** Nulo quando a conta não existe ou é de outro usuário (ADR-0012). */
    fun find(id: UUID): AccountInfo? = accountService.lookup(id)?.let {
        AccountInfo(it.id, it.name, !it.type.isBankAccount, it.archived, it.competenceOffset)
    }
}
