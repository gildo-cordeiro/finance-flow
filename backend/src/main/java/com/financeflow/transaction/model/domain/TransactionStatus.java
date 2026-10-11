package com.financeflow.transaction.model.domain;

/** Status derivado das datas por {@link TransactionStatusPolicy}. A ordem dos valores não deve mudar. */
public enum TransactionStatus {
    /** Sem pagamento e vencimento posterior a hoje. */
    PLANNED,
    /** Pagamento registrado ({@code payment_date} preenchida). */
    PAID,
    /** Sem pagamento e vencimento hoje. */
    PENDING,
    /** Sem pagamento e vencimento anterior a hoje. */
    OVERDUE
}
