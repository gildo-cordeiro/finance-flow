package com.financeflow.invoice.infra

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/** O `id` é também o `transfer_group_id` das duas pontas do pagamento (ADR-0039). */
@Entity
@Table(name = "invoice_payments")
class InvoicePaymentEntity(
    @Id
    val id: UUID,

    @Column(name = "invoice_id", nullable = false, updatable = false)
    val invoiceId: UUID,

    @Column(name = "from_account_id", nullable = false, updatable = false)
    val fromAccountId: UUID,

    @Column(nullable = false, updatable = false)
    val amount: BigDecimal,

    @Column(name = "payment_date", nullable = false, updatable = false)
    val paymentDate: LocalDate,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,
)
