package com.financeflow.transaction.service;

import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.mapper.TransactionMapper;
import com.financeflow.transaction.repository.TransactionRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ListTransactionsUseCase {

    private static final Logger log = LoggerFactory.getLogger(ListTransactionsUseCase.class);

    private final TransactionRepository transactionRepository;

    public ListTransactionsUseCase(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<TransactionResponse> execute(
        UUID userId,
        LocalDate startDate,
        LocalDate endDate,
        UUID categoryId,
        UUID accountId
    ) {
        log.info("Listing transactions for user={}, startDate={}, endDate={}, categoryId={}, accountId={}",
            userId, startDate, endDate, categoryId, accountId);

        return transactionRepository.findAllFiltered(userId, startDate, endDate, categoryId, accountId).stream()
            .map(TransactionMapper::toDomain)
            .map(t -> new TransactionResponse(
                t.id(),
                t.userId(),
                t.accountId(),
                t.categoryId(),
                t.description(),
                t.amount(),
                t.type(),
                t.competenceDate(),
                t.dueDate(),
                t.paymentDate(),
                t.status(),
                t.visibility(),
                t.installmentGroupId(),
                t.installmentNumber(),
                t.totalInstallments(),
                t.isRecurring(),
                t.recurrenceRule(),
                t.recurrenceGroupId()
            ))
            .toList();
    }
}
