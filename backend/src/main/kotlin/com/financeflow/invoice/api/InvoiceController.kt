package com.financeflow.invoice.api

import com.financeflow.invoice.application.InvoiceDetail
import com.financeflow.invoice.application.InvoicePreview
import com.financeflow.invoice.application.InvoiceService
import com.financeflow.invoice.application.InvoiceSummary
import com.financeflow.invoice.application.PurchaseCommand
import com.financeflow.invoice.application.PurchaseItem
import com.financeflow.invoice.domain.Installments
import com.financeflow.invoice.domain.InvoiceStatus
import com.financeflow.shared.error.ProblemResponse
import com.financeflow.transaction.CardItem
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

data class PurchaseRequest(
    @field:NotBlank @field:Size(max = 255)
    val description: String = "",
    @field:NotNull @field:DecimalMin("0.01") @field:Digits(integer = 15, fraction = 2)
    val amount: BigDecimal? = null,
    @field:NotNull
    val categoryId: UUID? = null,
    @field:NotNull
    val purchaseDate: LocalDate? = null,
    @field:Min(1) @field:Max(Installments.MAX.toLong())
    val installments: Int = 1,
) {
    // Anuláveis só para o @NotNull responder 422; chegam aqui já validados
    fun toCommand() = PurchaseCommand(
        description = description,
        amount = checkNotNull(amount),
        categoryId = checkNotNull(categoryId),
        purchaseDate = checkNotNull(purchaseDate),
        installments = installments,
    )
}

data class PurchaseItemResponse(
    val id: UUID,
    val invoiceId: UUID,
    val amount: BigDecimal,
    val dueDate: LocalDate,
    val competenceMonth: YearMonth,
)

data class InvoicePreviewResponse(val closingDate: LocalDate, val dueDate: LocalDate, val competenceMonth: YearMonth)

data class InvoiceResponse(
    val id: UUID?,
    val cardId: UUID,
    val closingDate: LocalDate,
    val dueDate: LocalDate,
    val competenceMonth: YearMonth,
    val status: InvoiceStatus,
    val total: BigDecimal,
    val paidAmount: BigDecimal,
    val itemCount: Long,
)

data class InvoiceItemResponse(
    val id: UUID,
    val description: String,
    val amount: BigDecimal,
    val categoryId: UUID?,
    val categoryName: String?,
    val parentCategoryName: String?,
    val purchaseDate: LocalDate,
    val installmentNumber: Int?,
    val totalInstallments: Int?,
    val paid: Boolean,
    val recurring: Boolean,
)

data class InvoiceDetailResponse(
    val invoice: InvoiceResponse,
    val cardName: String,
    val items: List<InvoiceItemResponse>,
    val previousInvoiceId: UUID?,
    val nextInvoiceId: UUID?,
)

@Tag(
    name = "Faturas",
    description = "Faturas por cartão e ciclo, com o total calculado dos itens (ADR-0009). Cada compra cai na fatura " +
        "cujo ciclo contém a data da compra (RN-04) e herda a competência da fatura (ADR-0008).",
)
@RestController
@RequestMapping("/api/v1")
class InvoiceController(private val invoiceService: InvoiceService) {

    @Operation(
        summary = "Lança uma compra no cartão",
        description = "Parcelada, cada parcela cai numa fatura consecutiva (RN-05), com os centavos na última " +
            "(RF-023). As faturas que faltam são criadas.",
    )
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "CARD_ARCHIVED")
    @PostMapping("/cards/{cardId}/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    fun purchase(@PathVariable cardId: UUID, @Valid @RequestBody request: PurchaseRequest) =
        invoiceService.purchase(cardId, request.toCommand()).map { it.toResponse() }

    @Operation(summary = "Mostra em que fatura cai uma compra nesta data", description = "Não grava nada.")
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/cards/{cardId}/invoices/preview")
    fun preview(
        @PathVariable cardId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) purchaseDate: LocalDate,
    ) = invoiceService.preview(cardId, purchaseDate).toResponse()

    @Operation(
        summary = "Lista as faturas do cartão",
        description = "Faturas já criadas, passadas e futuras, por data de fechamento. `from` e `to` filtram o fechamento.",
    )
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/cards/{cardId}/invoices")
    fun list(
        @PathVariable cardId: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ) = invoiceService.list(cardId, from, to).map { it.toResponse() }

    @Operation(
        summary = "Mostra a fatura atual do cartão",
        description = "A fatura em que cai uma compra feita hoje, no fuso do usuário. Sem compras, ela ainda não " +
            "existe: vem sem `id` e com total zero.",
    )
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/cards/{cardId}/invoices/current")
    fun current(@PathVariable cardId: UUID) = invoiceService.current(cardId).toResponse()

    @Operation(summary = "Detalha uma fatura com os itens", description = "Traz também a fatura anterior e a seguinte.")
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/invoices/{id}")
    fun get(@PathVariable id: UUID) = invoiceService.get(id).toResponse()

    @Operation(
        summary = "Exclui uma compra no cartão",
        description = "Recebe o id de qualquer item e exclui a compra inteira, com todas as parcelas.",
    )
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "PURCHASE_HAS_PAID_ITEMS")
    @DeleteMapping("/card-purchases/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePurchase(@PathVariable itemId: UUID) = invoiceService.deletePurchase(itemId)

    private fun PurchaseItem.toResponse() = PurchaseItemResponse(id, invoiceId, amount, dueDate, competenceMonth)

    private fun InvoicePreview.toResponse() = InvoicePreviewResponse(closingDate, dueDate, competenceMonth)

    private fun InvoiceSummary.toResponse() = InvoiceResponse(
        id, cardId, closingDate, dueDate, competenceMonth, status, total, paidAmount, itemCount,
    )

    private fun InvoiceDetail.toResponse() = InvoiceDetailResponse(
        invoice = summary.toResponse(),
        cardName = cardName,
        items = items.map { it.toResponse() },
        previousInvoiceId = previousInvoiceId,
        nextInvoiceId = nextInvoiceId,
    )

    private fun CardItem.toResponse() = InvoiceItemResponse(
        id, description, amount, categoryId, categoryName, parentCategoryName, purchaseDate, installmentNumber,
        totalInstallments, paid, recurring,
    )
}
