package com.financeflow.transaction.api

import com.financeflow.shared.error.ProblemResponse
import com.financeflow.shared.error.ValidationException
import com.financeflow.transaction.api.dto.CompetenceSuggestionResponse
import com.financeflow.transaction.api.dto.PayTransactionRequest
import com.financeflow.transaction.api.dto.SaveTransactionRequest
import com.financeflow.transaction.api.dto.TotalsResponse
import com.financeflow.transaction.api.dto.TransactionPageResponse
import com.financeflow.transaction.api.dto.TransactionResponse
import com.financeflow.transaction.application.TransactionPage
import com.financeflow.transaction.application.TransactionService
import com.financeflow.transaction.domain.DateField
import com.financeflow.transaction.domain.TransactionFilter
import com.financeflow.transaction.domain.TransactionStatus
import com.financeflow.transaction.domain.TransactionType
import com.financeflow.transaction.domain.TransactionView
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

@Tag(
    name = "Transações",
    description = "Receitas e despesas em conta. Transferências, parcelas e compras no cartão têm cadastro " +
        "próprio. Cada transação tem competência, vencimento e pagamento (ADR-0007).",
)
@RestController
@RequestMapping("/api/v1/transactions")
class TransactionController(private val transactionService: TransactionService) {

    @Operation(
        summary = "Lista as transações do período com os totais",
        description = "`dateField` escolhe a data do filtro (competência, vencimento ou pagamento). `categoryId` " +
            "inclui as subcategorias. Os totais cobrem o filtro todo, não só a página, e ignoram " +
            "transferências.",
    )
    @ProblemResponse(422, "VALIDATION_FAILED")
    @GetMapping
    fun list(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
        @RequestParam(defaultValue = "COMPETENCE") dateField: DateField,
        @RequestParam(required = false) accountId: UUID?,
        @RequestParam(required = false) categoryId: UUID?,
        @RequestParam(required = false) status: Set<TransactionStatus>?,
        @RequestParam(required = false) type: TransactionType?,
        @RequestParam(required = false) @Size(max = 100) q: String?,
        @RequestParam(defaultValue = "0") @Min(0) page: Int,
        @RequestParam(defaultValue = "50") @Min(1) @Max(200) size: Int,
    ): TransactionPageResponse {
        if (to.isBefore(from)) throw ValidationException("to", "A data final é anterior à inicial")
        val filter = TransactionFilter(from, to, dateField, accountId, categoryId, status.orEmpty(), type, q)
        return transactionService.list(filter, page, size).toResponse()
    }

    @Operation(
        summary = "Sugere a competência para uma conta e data",
        description = "Mês da data menos o deslocamento de competência da conta (ADR-0008).",
    )
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/competence-suggestion")
    fun competenceSuggestion(
        @RequestParam accountId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
    ) = CompetenceSuggestionResponse(transactionService.suggestCompetence(accountId, date))

    @Operation(summary = "Detalha uma transação")
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID) = transactionService.get(id).toResponse()

    @Operation(
        summary = "Cria uma receita ou despesa",
        description = "Sem `competenceMonth`, usa a competência sugerida. Sem `status`, fica pendente, ou paga se " +
            "houver `paymentDate`; o atraso é calculado (RN-06).",
    )
    @ProblemResponse(422, "VALIDATION_FAILED", "USE_CARD_ENDPOINT")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: SaveTransactionRequest) =
        transactionService.create(request.toCommand()).toResponse()

    @Operation(summary = "Altera uma transação")
    @ProblemResponse(422, "VALIDATION_FAILED", "USE_CARD_ENDPOINT")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "TRANSACTION_NOT_EDITABLE_HERE")
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: SaveTransactionRequest) =
        transactionService.update(id, request.toCommand()).toResponse()

    @Operation(summary = "Exclui uma transação")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "TRANSACTION_NOT_EDITABLE_HERE")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = transactionService.delete(id)

    @Operation(summary = "Marca a transação como paga", description = "Sem `paymentDate`, usa a data de hoje.")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "TRANSACTION_NOT_EDITABLE_HERE")
    @PostMapping("/{id}/pay")
    fun pay(@PathVariable id: UUID, @RequestBody(required = false) request: PayTransactionRequest?) =
        transactionService.pay(id, request?.paymentDate).toResponse()

    @Operation(summary = "Desfaz o pagamento")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "TRANSACTION_NOT_EDITABLE_HERE")
    @PostMapping("/{id}/unpay")
    fun unpay(@PathVariable id: UUID) = transactionService.unpay(id).toResponse()

    private fun TransactionPage.toResponse() = TransactionPageResponse(
        items = items.map { it.toResponse() },
        page = page,
        size = size,
        totals = TotalsResponse(totals.count, totals.income, totals.expense, totals.balance),
    )

    private fun TransactionView.toResponse() = TransactionResponse(
        id = id,
        type = type,
        description = description,
        amount = amount,
        accountId = accountId,
        accountName = accountName,
        categoryId = categoryId,
        categoryName = categoryName,
        parentCategoryName = parentCategoryName,
        competenceMonth = YearMonth.from(competenceDate),
        competenceInformed = competenceInformed,
        dueDate = dueDate,
        paymentDate = paymentDate,
        purchaseDate = purchaseDate,
        invoiceId = invoiceId,
        status = status,
        visibility = visibility,
        installmentNumber = installmentNumber,
        totalInstallments = totalInstallments,
        transferGroupId = transferGroupId,
        transferDirection = transferDirection,
        recurring = recurring,
    )
}
