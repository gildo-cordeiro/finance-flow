package com.financeflow.transaction.infra

import com.financeflow.transaction.domain.TransactionStatus
import com.financeflow.transaction.domain.TransactionType
import com.financeflow.transaction.domain.Visibility
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "transactions")
class TransactionEntity(
    @Id
    val id: UUID,

    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(name = "account_id", nullable = false)
    var accountId: UUID,

    @Column(name = "category_id")
    var categoryId: UUID?,

    @Column(nullable = false)
    var description: String,

    @Column(nullable = false)
    var amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var type: TransactionType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: TransactionStatus,

    @Column(name = "competence_date", nullable = false)
    var competenceDate: LocalDate,

    // ADR-0038: informada pelo usuário não é recalculada quando a data de referência muda
    @Column(name = "competence_informed", nullable = false)
    var competenceInformed: Boolean,

    @Column(name = "due_date")
    var dueDate: LocalDate?,

    @Column(name = "payment_date")
    var paymentDate: LocalDate?,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var visibility: Visibility,

    @Column(name = "created_by", updatable = false)
    val createdBy: UUID?,

    @Column(name = "updated_by")
    var updatedBy: UUID?,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,

    @Column(name = "installment_group_id", updatable = false)
    val installmentGroupId: UUID? = null,

    @Column(name = "installment_number", updatable = false)
    val installmentNumber: Short? = null,

    @Column(name = "total_installments", updatable = false)
    val totalInstallments: Short? = null,

    @Column(name = "transfer_group_id", insertable = false, updatable = false)
    val transferGroupId: UUID? = null,

    @Column(name = "invoice_id", updatable = false)
    val invoiceId: UUID? = null,

    @Column(name = "purchase_date", updatable = false)
    val purchaseDate: LocalDate? = null,
)
