package com.financeflow.transaction.model.domain;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Regra única do status de uma transação, derivada das datas.
 *
 * <ul>
 *   <li>{@code paymentDate} preenchida: {@link TransactionStatus#PAID}</li>
 *   <li>sem pagamento e {@code dueDate} anterior a hoje: {@link TransactionStatus#OVERDUE}</li>
 *   <li>sem pagamento e {@code dueDate} igual a hoje: {@link TransactionStatus#PENDING}</li>
 *   <li>sem pagamento e {@code dueDate} posterior a hoje: {@link TransactionStatus#PLANNED}</li>
 * </ul>
 *
 * <p>"Hoje" é recebido como parâmetro para facilitar testes e uma futura troca por fuso do usuário.
 */
public final class TransactionStatusPolicy {

    private TransactionStatusPolicy() {
    }

    public static TransactionStatus derive(LocalDate dueDate, LocalDate paymentDate, LocalDate today) {
        Objects.requireNonNull(dueDate, "dueDate cannot be null");
        Objects.requireNonNull(today, "today cannot be null");

        if (paymentDate != null) {
            return TransactionStatus.PAID;
        }
        if (dueDate.isBefore(today)) {
            return TransactionStatus.OVERDUE;
        }
        if (dueDate.isEqual(today)) {
            return TransactionStatus.PENDING;
        }
        return TransactionStatus.PLANNED;
    }
}
