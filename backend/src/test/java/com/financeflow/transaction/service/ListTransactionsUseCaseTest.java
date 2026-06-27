package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ListTransactionsUseCaseTest {

    private TransactionRepository transactionRepository;
    private CoupleRepository coupleRepository;
    private ListTransactionsUseCase listTransactionsUseCase;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        coupleRepository = mock(CoupleRepository.class);
        listTransactionsUseCase = new ListTransactionsUseCase(transactionRepository, coupleRepository);
    }

    @Test
    void shouldListTransactionsWithFilters() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        LocalDate startDate = LocalDate.of(2026, 6, 1);
        LocalDate endDate = LocalDate.of(2026, 6, 30);

        TransactionEntity entity = new TransactionEntity(
            UUID.randomUUID(), userId, accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            null, TransactionStatus.PENDING, TransactionVisibility.PERSONAL, Instant.now(), Instant.now()
        );

        when(transactionRepository.findAllFiltered(userId, startDate, endDate, categoryId, accountId))
            .thenReturn(List.of(entity));

        List<TransactionResponse> response = listTransactionsUseCase.execute(userId, startDate, endDate, categoryId, accountId);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).description()).isEqualTo("Lunch");
        assertThat(response.get(0).amount()).isEqualTo(new BigDecimal("50.00"));
    }
}
