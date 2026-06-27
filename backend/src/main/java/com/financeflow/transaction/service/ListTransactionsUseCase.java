package com.financeflow.transaction.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.entity.TransactionEntity;
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
    private final CoupleRepository coupleRepository;

    public ListTransactionsUseCase(
        TransactionRepository transactionRepository,
        CoupleRepository coupleRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.coupleRepository = coupleRepository;
    }

    public List<TransactionResponse> execute(
        UUID userId,
        LocalDate startDate,
        LocalDate endDate,
        UUID categoryId,
        UUID accountId
    ) {
        return execute(userId, "PERSONAL", startDate, endDate, categoryId, accountId);
    }

    public List<TransactionResponse> execute(
        UUID userId,
        String viewContext,
        LocalDate startDate,
        LocalDate endDate,
        UUID categoryId,
        UUID accountId
    ) {
        log.info("Listing transactions for user={}, viewContext={}, startDate={}, endDate={}, categoryId={}, accountId={}",
            userId, viewContext, startDate, endDate, categoryId, accountId);

        List<TransactionEntity> transactions;

        if ("COUPLE".equalsIgnoreCase(viewContext)) {
            Couple couple = coupleRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new BusinessException("NO_ACTIVE_COUPLE", "This feature requires an active couple link"));
            UUID partnerId = couple.user1Id().equals(userId) ? couple.user2Id() : couple.user1Id();
            transactions = transactionRepository.findAllFilteredCouple(userId, partnerId, startDate, endDate, categoryId, accountId);
        } else {
            transactions = transactionRepository.findAllFiltered(userId, startDate, endDate, categoryId, accountId);
        }

        return transactions.stream()
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
