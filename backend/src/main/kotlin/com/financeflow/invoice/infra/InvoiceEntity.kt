package com.financeflow.invoice.infra

import com.financeflow.invoice.domain.InvoiceStatus
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
@Table(name = "invoices")
class InvoiceEntity(
    @Id
    val id: UUID,

    @Column(name = "account_id", nullable = false, updatable = false)
    val accountId: UUID,

    @Column(name = "closing_date", nullable = false, updatable = false)
    val closingDate: LocalDate,

    @Column(name = "due_date", nullable = false, updatable = false)
    val dueDate: LocalDate,

    @Column(name = "competence_month", nullable = false, updatable = false)
    val competenceMonth: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: InvoiceStatus = InvoiceStatus.OPEN,

    @Column(name = "paid_amount", nullable = false)
    var paidAmount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,
)
