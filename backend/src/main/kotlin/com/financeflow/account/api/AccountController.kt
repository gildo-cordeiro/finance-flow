package com.financeflow.account.api

import com.financeflow.account.api.dto.AccountResponse
import com.financeflow.account.api.dto.AccountsSummaryResponse
import com.financeflow.account.api.dto.SaveAccountRequest
import com.financeflow.account.application.Account
import com.financeflow.account.application.AccountService
import com.financeflow.account.application.AccountsSummary
import com.financeflow.shared.error.ProblemResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
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
import java.util.UUID

@Tag(name = "Contas", description = "Contas correntes e poupanças. O saldo é calculado, não guardado (ADR-0011).")
@RestController
@RequestMapping("/api/v1/accounts")
class AccountController(private val accountService: AccountService) {

    @Operation(summary = "Lista as contas com o saldo atual")
    @GetMapping
    fun list(@RequestParam(defaultValue = "false") includeArchived: Boolean) =
        accountService.list(includeArchived).map { it.toResponse() }

    @Operation(
        summary = "Resume as contas ativas",
        description = "`balance` soma o saldo de hoje das contas correntes e poupanças não arquivadas.",
    )
    @GetMapping("/summary")
    fun summary() = accountService.summary().toResponse()

    @Operation(summary = "Detalha uma conta")
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID) = accountService.get(id).toResponse()

    @Operation(summary = "Cria uma conta", description = "Cartão de crédito tem cadastro próprio.")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: SaveAccountRequest) =
        accountService.create(request.toCommand()).toResponse()

    @Operation(summary = "Altera uma conta")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "ACCOUNT_IS_CREDIT_CARD")
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: SaveAccountRequest) =
        accountService.update(id, request.toCommand()).toResponse()

    @Operation(summary = "Arquiva uma conta")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "ACCOUNT_IS_CREDIT_CARD")
    @PostMapping("/{id}/archive")
    fun archive(@PathVariable id: UUID) = accountService.setArchived(id, true).toResponse()

    @Operation(summary = "Desarquiva uma conta")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "ACCOUNT_IS_CREDIT_CARD")
    @PostMapping("/{id}/unarchive")
    fun unarchive(@PathVariable id: UUID) = accountService.setArchived(id, false).toResponse()

    @Operation(summary = "Exclui uma conta sem transações")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "ACCOUNT_IN_USE", "ACCOUNT_IS_CREDIT_CARD")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = accountService.delete(id)

    private fun AccountsSummary.toResponse() = AccountsSummaryResponse(balance, accountCount)

    private fun Account.toResponse() =
        AccountResponse(id, name, type, bank, initialBalance, competenceOffset, archived, balance)
}
