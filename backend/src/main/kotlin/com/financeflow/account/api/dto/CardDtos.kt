package com.financeflow.account.api.dto

import com.financeflow.account.application.SaveCardCommand
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.util.UUID

data class SaveCardRequest(
    @field:NotBlank @field:Size(max = 100)
    val name: String = "",
    @field:Size(max = 30)
    val brand: String? = null,
    @field:NotNull @field:DecimalMin("0") @field:Digits(integer = 15, fraction = 2)
    val creditLimit: BigDecimal? = null,
    @field:NotNull @field:Min(1) @field:Max(31)
    val closingDay: Int? = null,
    @field:NotNull @field:Min(1) @field:Max(31)
    val dueDay: Int? = null,
    // ADR-0008: a fatura que vence num mês é paga com a renda do mês anterior
    @field:Min(0) @field:Max(12)
    val competenceOffset: Int = 1,
    val defaultPaymentAccountId: UUID? = null,
) {
    // Anuláveis só para o @NotNull responder 422; chegam aqui já validados
    fun toCommand() = SaveCardCommand(
        name = name,
        brand = brand,
        creditLimit = checkNotNull(creditLimit),
        closingDay = checkNotNull(closingDay),
        dueDay = checkNotNull(dueDay),
        competenceOffset = competenceOffset,
        defaultPaymentAccountId = defaultPaymentAccountId,
    )
}

data class CardResponse(
    val id: UUID,
    val name: String,
    val brand: String?,
    val creditLimit: BigDecimal,
    val closingDay: Int,
    val dueDay: Int,
    val competenceOffset: Int,
    val defaultPaymentAccountId: UUID?,
    val archived: Boolean,
    @field:Schema(description = "Faturas não quitadas, atuais e futuras, menos o que já foi pago delas (RF-034)")
    val used: BigDecimal,
    @field:Schema(description = "Limite menos o usado; negativo quando as compras passam do limite")
    val available: BigDecimal,
)
