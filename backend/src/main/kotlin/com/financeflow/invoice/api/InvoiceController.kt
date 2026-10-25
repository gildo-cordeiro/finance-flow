package com.financeflow.invoice.api

import com.financeflow.invoice.api.dto.InvoiceDetailResponse
import com.financeflow.invoice.api.dto.InvoiceItemResponse
import com.financeflow.invoice.api.dto.InvoicePaymentResponse
import com.financeflow.invoice.api.dto.InvoicePreviewResponse
import com.financeflow.invoice.api.dto.InvoiceResponse
import com.financeflow.invoice.api.dto.PayInvoiceRequest
import com.financeflow.invoice.api.dto.PurchaseItemResponse
import com.financeflow.invoice.api.dto.PurchaseRequest
import com.financeflow.invoice.application.InvoiceDetail
import com.financeflow.invoice.application.InvoicePayment
import com.financeflow.invoice.application.InvoicePreview
import com.financeflow.invoice.application.InvoiceService
import com.financeflow.invoice.application.InvoiceSummary
import com.financeflow.invoice.application.PurchaseItem
import com.financeflow.shared.error.ProblemResponse
import com.financeflow.transaction.CardItem
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
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
import java.time.LocalDate
import java.util.UUID

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
    @ProblemResponse(409, "PURCHASE_HAS_PAID_ITEMS", "INVOICE_HAS_PAYMENTS")
    @DeleteMapping("/card-purchases/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletePurchase(@PathVariable itemId: UUID) = invoiceService.deletePurchase(itemId)

    @Operation(
        summary = "Paga a fatura, toda ou em parte",
        description = "Gera uma transferência da conta pagadora para o cartão, que não entra no orçamento " +
            "(ADR-0039). Quitada, a fatura e os itens ficam pagos; em parte, a fatura fica `PARTIALLY_PAID` e os " +
            "itens continuam em aberto. Sem `paymentDate`, usa a data de hoje. Valor acima do saldo em aberto é 422.",
    )
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @PostMapping("/invoices/{id}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    fun pay(@PathVariable id: UUID, @Valid @RequestBody request: PayInvoiceRequest) =
        invoiceService.pay(id, request.toCommand()).toResponse()

    @Operation(
        summary = "Estorna um pagamento da fatura",
        description = "Apaga a transferência, devolve o valor à conta pagadora e reabre a fatura e os itens.",
    )
    @ProblemResponse(404, "NOT_FOUND")
    @DeleteMapping("/invoices/{id}/payments/{paymentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun reversePayment(@PathVariable id: UUID, @PathVariable paymentId: UUID) =
        invoiceService.reversePayment(id, paymentId)

    private fun InvoicePayment.toResponse() =
        InvoicePaymentResponse(id, fromAccountId, fromAccountName, amount, paymentDate)

    private fun PurchaseItem.toResponse() = PurchaseItemResponse(id, invoiceId, amount, dueDate, competenceMonth)

    private fun InvoicePreview.toResponse() = InvoicePreviewResponse(closingDate, dueDate, competenceMonth)

    private fun InvoiceSummary.toResponse() = InvoiceResponse(
        id, cardId, closingDate, dueDate, competenceMonth, status, total, paidAmount, openAmount, itemCount,
    )

    private fun InvoiceDetail.toResponse() = InvoiceDetailResponse(
        invoice = summary.toResponse(),
        cardName = cardName,
        items = items.map { it.toResponse() },
        payments = payments.map { it.toResponse() },
        previousInvoiceId = previousInvoiceId,
        nextInvoiceId = nextInvoiceId,
    )

    private fun CardItem.toResponse() = InvoiceItemResponse(
        id, description, amount, categoryId, categoryName, parentCategoryName, purchaseDate, installmentNumber,
        totalInstallments, paid, recurring,
    )
}
