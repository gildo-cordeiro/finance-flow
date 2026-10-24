package com.financeflow.account.infra

import com.financeflow.account.domain.AccountType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "accounts")
class AccountEntity(
    @Id
    val id: UUID,

    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var type: AccountType,

    var bank: String?,

    @Column(name = "initial_balance", nullable = false)
    var initialBalance: BigDecimal,

    @Column(name = "competence_offset", nullable = false)
    var competenceOffset: Short,

    @Column(nullable = false)
    var archived: Boolean = false,

    @Column(name = "credit_limit")
    var creditLimit: BigDecimal? = null,

    @Column(name = "closing_day")
    var closingDay: Short? = null,

    @Column(name = "due_day")
    var dueDay: Short? = null,

    var brand: String? = null,

    @Column(name = "default_payment_account_id")
    var defaultPaymentAccountId: UUID? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,
)
