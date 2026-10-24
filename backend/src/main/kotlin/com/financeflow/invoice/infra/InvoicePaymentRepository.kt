package com.financeflow.invoice.infra

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface InvoicePaymentRepository : JpaRepository<InvoicePaymentEntity, UUID> {

    fun findByInvoiceIdOrderByPaymentDateAscIdAsc(invoiceId: UUID): List<InvoicePaymentEntity>

    fun findByIdAndInvoiceId(id: UUID, invoiceId: UUID): InvoicePaymentEntity?
}
