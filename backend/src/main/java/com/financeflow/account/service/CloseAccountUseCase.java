package com.financeflow.account.service;

import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CloseAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(CloseAccountUseCase.class);
    private final AccountRepository accountRepository;

    public CloseAccountUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public void execute(UUID userId, UUID accountId) {
        log.info("Closing account={} for user={}", accountId, userId);

        AccountEntity entity = accountRepository.findById(accountId)
            .orElseThrow(() -> new NotFoundException("Account", accountId));

        if (!entity.getUserId().equals(userId)) {
            throw new ForbiddenException("Account does not belong to the authenticated user");
        }
        if (entity.getType() == AccountType.CREDIT_CARD) {
            throw new BusinessException("CREDIT_CARD_CANNOT_BE_CLOSED",
                "Credit cards cannot be closed. Use archive instead.");
        }
        if (entity.getStatus() == AccountStatus.CLOSED) {
            throw new BusinessException("ALREADY_CLOSED", "Account is already closed");
        }
        if (entity.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessException("NON_ZERO_BALANCE",
                "Cannot close account with non-zero balance: " + entity.getBalance());
        }

        entity.setStatus(AccountStatus.CLOSED);
        entity.setUpdatedAt(Instant.now());
        accountRepository.save(entity);
        log.info("Account={} closed successfully", accountId);
    }
}
