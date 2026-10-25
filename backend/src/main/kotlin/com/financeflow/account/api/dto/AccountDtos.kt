package com.financeflow.account.api.dto

import com.financeflow.account.application.SaveAccountCommand
import com.financeflow.account.domain.AccountType
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.util.UUID

data class SaveAccountRequest(
    @field:NotBlank @field:Size(max = 100)
    val name: String = "",
    @field:NotNull
    val type: AccountType? = null,
    @field:Size(max = 100)
    val bank: String? = null,
    @field:NotNull @field:Digits(integer = 15, fraction = 2)
    val initialBalance: BigDecimal? = null,
    // ADR-0008: corrente e poupança usam 0 por padrão; limite de 12 meses pelo ADR-0037
    @field:Min(0) @field:Max(12)
    val competenceOffset: Int = 0,
) {
    // Anuláveis só para o @NotNull responder 422; chegam aqui já validados
    fun toCommand() = SaveAccountCommand(name, checkNotNull(type), bank, checkNotNull(initialBalance), competenceOffset)
}

data class AccountResponse(
    val id: UUID,
    val name: String,
    val type: AccountType,
    val bank: String?,
    val initialBalance: BigDecimal,
    val competenceOffset: Int,
    val archived: Boolean,
    val balance: BigDecimal,
)

data class AccountsSummaryResponse(val balance: BigDecimal, val accountCount: Int)
