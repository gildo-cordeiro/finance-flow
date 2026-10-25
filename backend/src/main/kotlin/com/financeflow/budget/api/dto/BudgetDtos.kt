package com.financeflow.budget.api.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.YearMonth
import java.util.UUID

data class SetPlannedRequest(
    @field:NotNull @field:DecimalMin("0") @field:Digits(integer = 15, fraction = 2)
    val plannedAmount: BigDecimal? = null,
)

enum class BudgetCategoryType { INCOME, EXPENSE }

data class BudgetLineResponse(
    val categoryId: UUID,
    val name: String,
    val type: BudgetCategoryType,
    val archived: Boolean,
    val directPlanned: BigDecimal?,
    val planned: BigDecimal?,
    val realized: BigDecimal,
    val realizedPaid: BigDecimal,
    val remaining: BigDecimal?,
    val percentUsed: Int?,
    val children: List<BudgetLineResponse>,
)

data class BudgetTotalsResponse(
    val planned: BigDecimal,
    val realized: BigDecimal,
    val realizedPaid: BigDecimal,
    val remaining: BigDecimal,
    val percentUsed: Int?,
)

data class TotalsByTypeResponse(val income: BudgetTotalsResponse, val expense: BudgetTotalsResponse)

data class BudgetResponse(
    val month: YearMonth,
    val categories: List<BudgetLineResponse>,
    val totals: TotalsByTypeResponse,
    val previousMonthPlanned: BigDecimal,
)
