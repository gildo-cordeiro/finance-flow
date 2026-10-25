package com.financeflow.transaction.api.dto

import com.financeflow.transaction.application.SaveTransactionCommand
import com.financeflow.transaction.domain.TransactionStatus
import com.financeflow.transaction.domain.TransactionType
import com.financeflow.transaction.domain.Visibility
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.util.UUID

data class SaveTransactionRequest(
    @field:NotNull
    val type: TransactionType? = null,
    @field:NotBlank @field:Size(max = 255)
    val description: String = "",
    @field:NotNull @field:DecimalMin("0.01") @field:Digits(integer = 15, fraction = 2)
    val amount: BigDecimal? = null,
    @field:NotNull
    val accountId: UUID? = null,
    @field:NotNull
    val categoryId: UUID? = null,
    // Sem competência, o backend sugere pelo vencimento e pelo deslocamento da conta (ADR-0008)
    val competenceMonth: YearMonth? = null,
    val dueDate: LocalDate? = null,
    val paymentDate: LocalDate? = null,
    val status: TransactionStatus? = null,
    val visibility: Visibility = Visibility.PRIVATE,
) {
    fun toCommand() = SaveTransactionCommand(
        type = checkNotNull(type),
        description = description,
        amount = checkNotNull(amount),
        accountId = checkNotNull(accountId),
        categoryId = checkNotNull(categoryId),
        competenceMonth = competenceMonth,
        dueDate = dueDate,
        paymentDate = paymentDate,
        status = status,
        visibility = visibility,
    )
}

data class PayTransactionRequest(val paymentDate: LocalDate? = null)

data class TransactionResponse(
    val id: UUID,
    val type: TransactionType,
    val description: String,
    val amount: BigDecimal,
    val accountId: UUID,
    val accountName: String,
    val categoryId: UUID?,
    val categoryName: String?,
    val parentCategoryName: String?,
    val competenceMonth: YearMonth,
    @field:Schema(description = "Verdadeiro quando o usuário informou a competência; falso quando foi sugerida (ADR-0038)")
    val competenceInformed: Boolean,
    val dueDate: LocalDate?,
    val paymentDate: LocalDate?,
    @field:Schema(description = "Só em compras no cartão: a data da compra, que escolhe a fatura (RN-04)")
    val purchaseDate: LocalDate?,
    val invoiceId: UUID?,
    val status: TransactionStatus,
    val visibility: Visibility,
    val installmentNumber: Int?,
    val totalInstallments: Int?,
    val transferGroupId: UUID?,
    val transferDirection: String?,
    val recurring: Boolean,
)

data class TotalsResponse(val count: Long, val income: BigDecimal, val expense: BigDecimal, val balance: BigDecimal)

data class TransactionPageResponse(
    val items: List<TransactionResponse>,
    val page: Int,
    val size: Int,
    val totals: TotalsResponse,
)

data class CompetenceSuggestionResponse(val competenceMonth: YearMonth)
