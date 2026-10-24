package com.financeflow.transaction.domain

import com.financeflow.shared.error.ValidationException
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth

/**
 * Receita ou despesa em conta comum, com as três datas (RN-01, ADR-0007).
 * Concentra as regras de competência e de status que valem ao lançar, editar e pagar.
 */
data class Entry(
    val type: TransactionType,
    val amount: BigDecimal,
    val competence: YearMonth,
    val dueDate: LocalDate?,
    val paymentDate: LocalDate?,
    val status: TransactionStatus,
) {

    fun paid(on: LocalDate) = copy(status = TransactionStatus.PAID, paymentDate = on)

    /** Volta a pendente, ou atrasado se o vencimento já passou (RN-06). */
    fun unpaid(today: LocalDate): Entry {
        if (status != TransactionStatus.PAID) return this
        return copy(
            status = TransactionStatusPolicy.resolve(TransactionStatus.PENDING, null, dueDate, today),
            paymentDate = null,
        )
    }

    companion object {

        fun of(
            type: TransactionType,
            amount: BigDecimal,
            informedCompetence: YearMonth?,
            dueDate: LocalDate?,
            paymentDate: LocalDate?,
            requestedStatus: TransactionStatus?,
            competenceOffset: Int,
            today: LocalDate,
        ): Entry {
            if (type == TransactionType.TRANSFER) throw ValidationException("type", "Transferências têm cadastro próprio")
            requestedStatus?.let { status ->
                TransactionStatusPolicy.violation(status, paymentDate)?.let { throw ValidationException("paymentDate", it) }
            }
            val reference = Competence.referenceDate(dueDate, paymentDate)
                ?: throw ValidationException("dueDate", "Informe o vencimento ou a data de pagamento")
            // ADR-0008: a sugestão nunca sobrescreve uma competência informada
            val competence = informedCompetence ?: Competence.suggest(reference, competenceOffset)
            val status = TransactionStatusPolicy.resolve(requestedStatus, paymentDate, dueDate, today)
            return Entry(type, amount, competence, dueDate, paymentDate, status)
        }
    }
}
