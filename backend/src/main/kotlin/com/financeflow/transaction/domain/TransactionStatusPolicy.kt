package com.financeflow.transaction.domain

import java.time.LocalDate

object TransactionStatusPolicy {

    /** RN-01: data de pagamento se, e somente se, o status é pago. */
    fun violation(status: TransactionStatus, paymentDate: LocalDate?): String? = when {
        status == TransactionStatus.PAID && paymentDate == null -> "Informe a data de pagamento"
        status != TransactionStatus.PAID && paymentDate != null -> "Data de pagamento só vale para transações pagas"
        else -> null
    }

    /** RN-06: não paga e com vencimento antes de hoje, no fuso do usuário. */
    fun isOverdue(status: TransactionStatus, dueDate: LocalDate?, today: LocalDate): Boolean =
        status != TransactionStatus.PAID && dueDate != null && dueDate.isBefore(today)

    /**
     * Status de uma transação nova ou editada. Sem status pedido, vale o pago quando há data de pagamento.
     * A passagem para atrasado é automática (RF-025), então um status não pago é corrigido pelo vencimento.
     */
    fun resolve(requested: TransactionStatus?, paymentDate: LocalDate?, dueDate: LocalDate?, today: LocalDate): TransactionStatus {
        val status = requested ?: if (paymentDate != null) TransactionStatus.PAID else TransactionStatus.PENDING
        return when {
            status == TransactionStatus.PAID -> status
            isOverdue(status, dueDate, today) -> TransactionStatus.OVERDUE
            status == TransactionStatus.OVERDUE -> TransactionStatus.PENDING
            else -> status
        }
    }
}
