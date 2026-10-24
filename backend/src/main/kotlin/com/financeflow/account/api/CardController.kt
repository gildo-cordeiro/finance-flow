package com.financeflow.account.api

import com.financeflow.account.application.Card
import com.financeflow.account.application.CardService
import com.financeflow.account.application.SaveCardCommand
import com.financeflow.shared.error.ProblemResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMin
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

@Tag(
    name = "Cartões",
    description = "Cartões de crédito. O fechamento decide a fatura de cada compra (RN-04), e a competência da " +
        "fatura é o mês do vencimento menos o deslocamento do cartão (ADR-0008).",
)
@RestController
@RequestMapping("/api/v1/cards")
class CardController(private val cardService: CardService) {

    @Operation(summary = "Lista os cartões")
    @GetMapping
    fun list(@RequestParam(defaultValue = "false") includeArchived: Boolean) =
        cardService.list(includeArchived).map { it.toResponse() }

    @Operation(summary = "Detalha um cartão")
    @ProblemResponse(404, "NOT_FOUND")
    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID) = cardService.get(id).toResponse()

    @Operation(summary = "Cria um cartão")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: SaveCardRequest) = cardService.create(request.toCommand()).toResponse()

    @Operation(
        summary = "Altera um cartão",
        description = "Novos dias de fechamento e vencimento valem a partir da próxima fatura: as já criadas " +
            "mantêm as datas delas (ADR-0009).",
    )
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: SaveCardRequest) =
        cardService.update(id, request.toCommand()).toResponse()

    @Operation(summary = "Arquiva um cartão")
    @ProblemResponse(404, "NOT_FOUND")
    @PostMapping("/{id}/archive")
    fun archive(@PathVariable id: UUID) = cardService.setArchived(id, true).toResponse()

    @Operation(summary = "Desarquiva um cartão")
    @ProblemResponse(404, "NOT_FOUND")
    @PostMapping("/{id}/unarchive")
    fun unarchive(@PathVariable id: UUID) = cardService.setArchived(id, false).toResponse()

    @Operation(summary = "Exclui um cartão sem compras")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "ACCOUNT_IN_USE")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = cardService.delete(id)

    private fun Card.toResponse() = CardResponse(
        id, name, brand, creditLimit, closingDay, dueDay, competenceOffset, defaultPaymentAccountId, archived, used,
        available,
    )
}
