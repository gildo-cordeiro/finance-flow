package com.financeflow.dashboard.api.dto

import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

data class FlowResponse(val realized: BigDecimal, val paid: BigDecimal, val pending: BigDecimal)

data class AccountBalanceResponse(val id: UUID, val name: String, val savings: Boolean, val balance: BigDecimal)

data class PayableResponse(
    val id: UUID,
    val description: String,
    val amount: BigDecimal,
    val accountName: String,
    val categoryName: String?,
    val dueDate: LocalDate,
    val overdue: Boolean,
)

data class UpcomingInvoiceResponse(
    val id: UUID,
    val cardId: UUID,
    val cardName: String,
    val dueDate: LocalDate,
    val total: BigDecimal,
    val openAmount: BigDecimal,
    val partiallyPaid: Boolean,
    val overdue: Boolean,
)

data class PayablesResponse(val items: List<PayableResponse>, val overdueCount: Long)

data class BudgetCategoryResponse(
    val categoryId: UUID,
    val name: String,
    val planned: BigDecimal?,
    val realized: BigDecimal,
    val percentUsed: Int?,
)

data class DashboardBudgetResponse(
    val planned: BigDecimal,
    val realized: BigDecimal,
    val percentUsed: Int?,
    val topCategories: List<BudgetCategoryResponse>,
)

data class DashboardResponse(
    val month: YearMonth,
    val income: FlowResponse,
    val expense: FlowResponse,
    val balance: BigDecimal,
    val accountsBalance: BigDecimal,
    val accounts: List<AccountBalanceResponse>,
    val payables: PayablesResponse,
    val upcomingInvoices: List<UpcomingInvoiceResponse>,
    val budget: DashboardBudgetResponse,
)
