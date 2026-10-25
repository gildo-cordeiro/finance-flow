package com.financeflow.dashboard.api

import com.financeflow.dashboard.api.dto.AccountBalanceResponse
import com.financeflow.dashboard.api.dto.BudgetCategoryResponse
import com.financeflow.dashboard.api.dto.DashboardBudgetResponse
import com.financeflow.dashboard.api.dto.DashboardResponse
import com.financeflow.dashboard.api.dto.FlowResponse
import com.financeflow.dashboard.api.dto.PayableResponse
import com.financeflow.dashboard.api.dto.PayablesResponse
import com.financeflow.dashboard.api.dto.UpcomingInvoiceResponse
import com.financeflow.dashboard.application.DashboardService
import com.financeflow.dashboard.application.DashboardSummary
import com.financeflow.shared.error.ProblemResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.YearMonth

@Tag(name = "Painel", description = "Resumo da competência: receitas, despesas, contas, vencimentos e orçamento.")
@RestController
@RequestMapping("/api/v1/dashboard")
class DashboardController(private val dashboardService: DashboardService) {

    @Operation(
        summary = "Resumo do mês",
        description = "Sem `month`, usa o mês de hoje no fuso do usuário. Receitas, despesas e resultado são da " +
            "competência, sem transferências. `accountsBalance` soma as contas correntes e poupanças ativas. " +
            "`payables` traz as despesas não pagas atrasadas ou com vencimento nos próximos 7 dias, fora do cartão. " +
            "`upcomingInvoices` traz as faturas com saldo em aberto vencidas ou que vencem nos próximos 30 dias.",
    )
    @ProblemResponse(400, "BAD_REQUEST")
    @GetMapping("/summary")
    fun summary(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") month: YearMonth?) =
        dashboardService.summary(month).toResponse()

    private fun DashboardSummary.toResponse() = DashboardResponse(
        month = month,
        income = FlowResponse(result.income, result.incomePaid, result.income - result.incomePaid),
        expense = FlowResponse(result.expense, result.expensePaid, result.expense - result.expensePaid),
        balance = balance,
        accountsBalance = accountsBalance,
        accounts = accounts.map { AccountBalanceResponse(it.id, it.name, it.savings, it.balance) },
        payables = PayablesResponse(
            payables.items.map {
                PayableResponse(it.id, it.description, it.amount, it.accountName, it.categoryName, it.dueDate, it.overdue)
            },
            payables.overdueCount,
        ),
        upcomingInvoices = invoices.map {
            UpcomingInvoiceResponse(
                it.id, it.cardId, it.cardName, it.dueDate, it.total, it.openAmount, it.partiallyPaid, it.overdue,
            )
        },
        budget = DashboardBudgetResponse(
            planned = budget.planned,
            realized = budget.realized,
            percentUsed = budget.percentUsed,
            topCategories = budget.highlights.map {
                BudgetCategoryResponse(it.categoryId, it.name, it.planned, it.realized, it.percentUsed)
            },
        ),
    )
}
