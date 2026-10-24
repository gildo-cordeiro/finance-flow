package com.financeflow.account.domain

enum class AccountType {
    CHECKING,
    SAVINGS,
    CREDIT_CARD,
    ;

    /** Cartão tem cadastro próprio, com fechamento e vencimento (F1-14). */
    val isBankAccount: Boolean get() = this != CREDIT_CARD
}
