package com.financeflow.budget.infra

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface BudgetRepository : JpaRepository<BudgetEntity, UUID> {

    fun findByUserIdAndMonth(userId: UUID, month: LocalDate): List<BudgetEntity>
}
