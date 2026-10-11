package com.financeflow.transaction.model.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TransactionStatusPolicyTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 11);

    @Test
    @DisplayName("com data de pagamento o status é PAID, mesmo com vencimento passado ou futuro")
    void shouldBePaidWhenPaymentDateIsPresent() {
        assertThat(TransactionStatusPolicy.derive(TODAY.minusDays(10), TODAY, TODAY)).isEqualTo(TransactionStatus.PAID);
        assertThat(TransactionStatusPolicy.derive(TODAY.plusDays(10), TODAY, TODAY)).isEqualTo(TransactionStatus.PAID);
    }

    @Test
    @DisplayName("sem pagamento e vencimento passado o status é OVERDUE")
    void shouldBeOverdueWhenDueDateIsInThePastAndNotPaid() {
        assertThat(TransactionStatusPolicy.derive(TODAY.minusDays(1), null, TODAY)).isEqualTo(TransactionStatus.OVERDUE);
    }

    @Test
    @DisplayName("sem pagamento e vencimento hoje o status é PENDING")
    void shouldBePendingWhenDueDateIsToday() {
        assertThat(TransactionStatusPolicy.derive(TODAY, null, TODAY)).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    @DisplayName("sem pagamento e vencimento futuro o status é PLANNED")
    void shouldBePlannedWhenDueDateIsInTheFuture() {
        assertThat(TransactionStatusPolicy.derive(TODAY.plusDays(1), null, TODAY)).isEqualTo(TransactionStatus.PLANNED);
    }

    @Test
    @DisplayName("vencimento e data de referência são obrigatórios")
    void shouldRejectNullDueDateOrToday() {
        assertThatThrownBy(() -> TransactionStatusPolicy.derive(null, null, TODAY)).isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> TransactionStatusPolicy.derive(TODAY, null, null)).isInstanceOf(NullPointerException.class);
    }
}
