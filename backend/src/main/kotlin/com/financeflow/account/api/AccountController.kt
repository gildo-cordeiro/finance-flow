package com.financeflow.account.api

import com.financeflow.account.application.Account
import com.financeflow.account.application.AccountService
import com.financeflow.account.application.SaveAccountCommand
import com.financeflow.account.domain.AccountType
import jakarta.validation.Valid
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
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
    // ADR-0008: corrente e poupança usam 0 por padrão
    @field:Min(0) @field:Max(12)
    val competenceOffset: Int = 0,
) {
    fun toCommand() = SaveAccountCommand(name, type!!, bank, initialBalance!!, competenceOffset)
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

@RestController
@RequestMapping("/api/v1/accounts")
class AccountController(private val accountService: AccountService) {

    @GetMapping
    fun list(@RequestParam(defaultValue = "false") includeArchived: Boolean) =
        accountService.list(includeArchived).map { it.toResponse() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID) = accountService.get(id).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: SaveAccountRequest) =
        accountService.create(request.toCommand()).toResponse()

    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: SaveAccountRequest) =
        accountService.update(id, request.toCommand()).toResponse()

    @PostMapping("/{id}/archive")
    fun archive(@PathVariable id: UUID) = accountService.setArchived(id, true).toResponse()

    @PostMapping("/{id}/unarchive")
    fun unarchive(@PathVariable id: UUID) = accountService.setArchived(id, false).toResponse()

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = accountService.delete(id)

    private fun Account.toResponse() =
        AccountResponse(id, name, type, bank, initialBalance, competenceOffset, archived, balance)
}
