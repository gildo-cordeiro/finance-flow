package com.financeflow.transaction.infra

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TransactionRepository : JpaRepository<TransactionEntity, UUID>, TransactionSearch {

    fun findByIdAndUserId(id: UUID, userId: UUID): TransactionEntity?
}
