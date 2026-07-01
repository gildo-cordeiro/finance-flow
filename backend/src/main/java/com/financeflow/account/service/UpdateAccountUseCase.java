package com.financeflow.account.service;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.dto.UpdateAccountRequest;
import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.model.mapper.AccountMapper;
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
public class UpdateAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(UpdateAccountUseCase.class);
    private final AccountRepository accountRepository;

    public UpdateAccountUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public AccountResponse execute(UUID userId, UUID accountId, UpdateAccountRequest request) {
        log.info("Updating account={} for user={}", accountId, userId);

        AccountEntity entity = accountRepository.findById(accountId)
            .orElseThrow(() -> new NotFoundException("Account", accountId));

        if (!entity.getUserId().equals(userId)) {
            throw new ForbiddenException("Account does not belong to the authenticated user");
        }
        if (entity.getStatus() == AccountStatus.CLOSED) {
            throw new BusinessException("ACCOUNT_CLOSED", "Cannot edit a closed account");
        }

        // Type is immutable — only update allowed fields
        entity.setName(request.name());
        entity.setBank(request.bank());

        if (entity.getType() == AccountType.CREDIT_CARD) {
            if (request.creditLimit() != null) {
                entity.setCreditLimit(request.creditLimit());
            }
            if (request.closingDay() != null) {
                entity.setClosingDay(request.closingDay());
            }
            if (request.dueDay() != null) {
                entity.setDueDay(request.dueDay());
            }
        } else {
            if (request.balance() != null) {
                entity.setBalance(request.balance());
            }
        }

        entity.setUpdatedAt(Instant.now());
        AccountEntity saved = accountRepository.save(entity);
        var domain = AccountMapper.toDomain(saved);

        return new AccountResponse(
            domain.id(), domain.userId(), domain.name(), domain.type(), domain.bank(),
            domain.balance(), domain.creditLimit(), domain.closingDay(), domain.dueDay(),
            domain.associatedAccountId(), domain.status()
        );
    }
}
