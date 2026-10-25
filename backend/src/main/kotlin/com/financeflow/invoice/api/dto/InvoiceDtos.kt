package com.financeflow.invoice.api.dto

import com.financeflow.invoice.application.PaymentCommand
import com.financeflow.invoice.application.PurchaseCommand
import com.financeflow.invoice.domain.Installments
import com.financeflow.invoice.domain.InvoiceStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
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

data class PayInvoiceRequest(
    @field:NotNull
    val fromAccountId: UUID? = null,
    @field:NotNull @field:DecimalMin("0.01") @field:Digits(integer = 15, fraction = 2)
    val amount: BigDecimal? = null,
    val paymentDate: LocalDate? = null,
) {
    fun toCommand() = PaymentCommand(checkNotNull(fromAccountId), checkNotNull(amount), paymentDate)
}

data class InvoicePaymentResponse(
    val id: UUID,
    val fromAccountId: UUID,
    val fromAccountName: String?,
    val amount: BigDecimal,
    val paymentDate: LocalDate,
)

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
    @field:Schema(description = "Total menos o que já foi pago, nunca negativo")
    val openAmount: BigDecimal,
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
    val payments: List<InvoicePaymentResponse>,
    val previousInvoiceId: UUID?,
    val nextInvoiceId: UUID?,
)
