package com.financeflow.account.service;

import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.repository.TransactionRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ArchiveAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(ArchiveAccountUseCase.class);
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public ArchiveAccountUseCase(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public void execute(UUID userId, UUID accountId) {
        log.info("Archiving account={} for user={}", accountId, userId);

        AccountEntity entity = accountRepository.findById(accountId)
            .orElseThrow(() -> new NotFoundException("Account", accountId));

        if (!entity.getUserId().equals(userId)) {
            throw new ForbiddenException("Account does not belong to the authenticated user");
        }
        if (entity.getStatus() == AccountStatus.ARCHIVED) {
            throw new BusinessException("ALREADY_ARCHIVED", "Account is already archived");
        }

        // Credit cards: block if pending or planned transactions exist in current/future billing cycles
        if (entity.getType() == AccountType.CREDIT_CARD) {
            boolean hasPendingOrPlanned = transactionRepository.existsByAccountIdAndStatusIn(
                accountId, List.of(TransactionStatus.PENDING, TransactionStatus.PLANNED));
            if (hasPendingOrPlanned) {
                throw new BusinessException("CARD_HAS_PENDING_TRANSACTIONS",
                    "Cannot archive credit card with PENDING or PLANNED transactions");
            }
        }

        entity.setStatus(AccountStatus.ARCHIVED);
        entity.setUpdatedAt(Instant.now());
        accountRepository.save(entity);
        log.info("Account={} archived successfully", accountId);
    }
}
