package com.financeflow.account.service;

import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UnarchiveAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(UnarchiveAccountUseCase.class);
    private final AccountRepository accountRepository;

    public UnarchiveAccountUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public void execute(UUID userId, UUID accountId) {
        log.info("Unarchiving account={} for user={}", accountId, userId);

        AccountEntity entity = accountRepository.findById(accountId)
            .orElseThrow(() -> new NotFoundException("Account", accountId));

        if (!entity.getUserId().equals(userId)) {
            throw new ForbiddenException("Account does not belong to the authenticated user");
        }
        if (entity.getStatus() != AccountStatus.ARCHIVED) {
            throw new BusinessException("NOT_ARCHIVED", "Account is not archived");
        }

        entity.setStatus(AccountStatus.ACTIVE);
        entity.setUpdatedAt(Instant.now());
        accountRepository.save(entity);
        log.info("Account={} unarchived successfully", accountId);
    }
}
