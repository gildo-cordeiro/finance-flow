package com.financeflow.transaction.infra

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TransactionRepository : JpaRepository<TransactionEntity, UUID>, TransactionSearch {

    fun findByIdAndUserId(id: UUID, userId: UUID): TransactionEntity?

    fun findByInstallmentGroupIdAndUserId(installmentGroupId: UUID, userId: UUID): List<TransactionEntity>

    fun findByTransferGroupIdAndUserId(transferGroupId: UUID, userId: UUID): List<TransactionEntity>

    fun findByInvoiceIdAndUserId(invoiceId: UUID, userId: UUID): List<TransactionEntity>
}
