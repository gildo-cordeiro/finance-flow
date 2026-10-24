package com.financeflow.account.api

import com.financeflow.account.application.Account
import com.financeflow.account.application.AccountService
import com.financeflow.account.application.SaveAccountCommand
import com.financeflow.account.domain.AccountType
import com.financeflow.shared.error.DocumentedError
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.util.UUID
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

data class SaveAccountRequest(
    @field:NotBlank @field:Size(max = 100)
    val name: String = "",
    @field:Schema(description = "`CREDIT_CARD` é recusado: cartões têm cadastro próprio")
    @field:NotNull
    val type: AccountType? = null,
    @field:Size(max = 100)
    val bank: String? = null,
    @field:Schema(description = "Até duas casas decimais; pode ser negativo")
    @field:NotNull @field:Digits(integer = 15, fraction = 2)
    val initialBalance: BigDecimal? = null,
    // ADR-0008: corrente e poupança usam 0 por padrão; limite de 12 meses pelo ADR-0037
    @field:Schema(description = "Meses subtraídos da data de referência para sugerir a competência (ADR-0008)")
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
    @field:Schema(description = "Saldo inicial + entradas pagas − saídas pagas, calculado (RN-07, ADR-0011)")
    val balance: BigDecimal,
)

@Tag(name = "Contas", description = "Contas corrente e poupança (RF-010, RF-011). Cartões têm cadastro próprio.")
@RestController
@RequestMapping("/api/v1/accounts")
class AccountController(private val accountService: AccountService) {

    @Operation(summary = "Lista as contas com o saldo calculado, em ordem alfabética")
    @GetMapping
    fun list(@Parameter(description = "Inclui as arquivadas") @RequestParam(defaultValue = "false") includeArchived: Boolean) =
        accountService.list(includeArchived).map { it.toResponse() }

    @Operation(summary = "Uma conta, com o saldo calculado")
    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID) = accountService.get(id).toResponse()

    @Operation(summary = "Cria conta corrente ou poupança")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: SaveAccountRequest) =
        accountService.create(request.toCommand()).toResponse()

    @Operation(summary = "Edita a conta")
    @DocumentedError(409, "ACCOUNT_IS_CREDIT_CARD", "A conta é um cartão de crédito")
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: SaveAccountRequest) =
        accountService.update(id, request.toCommand()).toResponse()

    @Operation(summary = "Arquiva a conta", description = "Some dos formulários, mas o histórico continua.")
    @DocumentedError(409, "ACCOUNT_IS_CREDIT_CARD", "A conta é um cartão de crédito")
    @PostMapping("/{id}/archive")
    fun archive(@PathVariable id: UUID) = accountService.setArchived(id, true).toResponse()

    @Operation(summary = "Desarquiva a conta")
    @DocumentedError(409, "ACCOUNT_IS_CREDIT_CARD", "A conta é um cartão de crédito")
    @PostMapping("/{id}/unarchive")
    fun unarchive(@PathVariable id: UUID) = accountService.setArchived(id, false).toResponse()

    @Operation(summary = "Exclui a conta sem transações")
    @DocumentedError(409, "ACCOUNT_IN_USE", "A conta tem transações; arquive em vez de excluir")
    @DocumentedError(409, "ACCOUNT_IS_CREDIT_CARD", "A conta é um cartão de crédito")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = accountService.delete(id)

    private fun Account.toResponse() =
        AccountResponse(id, name, type, bank, initialBalance, competenceOffset, archived, balance)
}
