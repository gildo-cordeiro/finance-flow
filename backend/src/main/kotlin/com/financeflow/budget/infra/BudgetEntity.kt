package com.financeflow.budget.infra

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/** Só o planejado; o realizado é calculado das transações (RN-07, ADR-0011). */
@Entity
@Table(name = "budgets")
class BudgetEntity(
    @Id
    val id: UUID,

    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(name = "category_id", nullable = false, updatable = false)
    val categoryId: UUID,

    @Column(nullable = false, updatable = false)
    val month: LocalDate,

    @Column(name = "planned_amount", nullable = false)
    var plannedAmount: BigDecimal,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,
)
