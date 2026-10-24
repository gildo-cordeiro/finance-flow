package com.financeflow.budget.api

import com.financeflow.budget.application.BudgetService
import com.financeflow.budget.application.BudgetView
import com.financeflow.budget.domain.BudgetLine
import com.financeflow.budget.domain.BudgetTotals
import com.financeflow.shared.error.ProblemResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.NotNull
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
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

@Tag(name = "Orçamento", description = "Planejado por categoria e mês, comparado ao realizado pela competência (RN-02).")
@RestController
@RequestMapping("/api/v1/budgets")
class BudgetController(private val budgetService: BudgetService) {

    @Operation(
        summary = "Orçamento do mês por categoria",
        description = "O realizado soma as transações da competência em qualquer status, sem transferências. Na " +
            "categoria mãe, planejado e realizado incluem as subcategorias. Categorias arquivadas só aparecem " +
            "com planejado ou realizado no mês.",
    )
    @ProblemResponse(400, "BAD_REQUEST")
    @GetMapping("/{month}")
    fun get(@PathVariable @DateTimeFormat(pattern = "yyyy-MM") month: YearMonth) =
        budgetService.view(month).toResponse()

    @Operation(summary = "Define o planejado de uma categoria no mês", description = "Zero remove o planejado.")
    @ProblemResponse(400, "BAD_REQUEST")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "CATEGORY_ARCHIVED")
    @PutMapping("/{month}/categories/{categoryId}")
    fun setPlanned(
        @PathVariable @DateTimeFormat(pattern = "yyyy-MM") month: YearMonth,
        @PathVariable categoryId: UUID,
        @Valid @RequestBody request: SetPlannedRequest,
    ) = budgetService.setPlanned(month, categoryId, checkNotNull(request.plannedAmount)).toResponse()

    @Operation(
        summary = "Copia o planejado do mês anterior",
        description = "Sem `overwrite`, mantém os valores já planejados no mês. Categorias arquivadas não são copiadas.",
    )
    @ProblemResponse(400, "BAD_REQUEST")
    @ProblemResponse(409, "NO_PREVIOUS_BUDGET")
    @PostMapping("/{month}/copy-from-previous")
    fun copyFromPrevious(
        @PathVariable @DateTimeFormat(pattern = "yyyy-MM") month: YearMonth,
        @RequestParam(defaultValue = "false") overwrite: Boolean,
    ) = budgetService.copyFromPrevious(month, overwrite).toResponse()

    private fun BudgetView.toResponse() = BudgetResponse(
        month = month,
        categories = lines.map { it.toResponse() },
        totals = TotalsByTypeResponse(income.toResponse(), expense.toResponse()),
        previousMonthPlanned = previousMonthPlanned,
    )

    private fun BudgetLine.toResponse(): BudgetLineResponse = BudgetLineResponse(
        categoryId = category.id,
        name = category.name,
        type = if (category.income) BudgetCategoryType.INCOME else BudgetCategoryType.EXPENSE,
        archived = category.archived,
        directPlanned = directPlanned,
        planned = planned,
        realized = realized.total,
        realizedPaid = realized.paid,
        remaining = remaining,
        percentUsed = percentUsed,
        children = children.map { it.toResponse() },
    )

    private fun BudgetTotals.toResponse() = BudgetTotalsResponse(planned, realized.total, realized.paid, remaining, percentUsed)
}
