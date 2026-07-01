package com.financeflow.account.service;

import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.domain.Account;
import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.model.mapper.AccountMapper;
import com.financeflow.account.repository.AccountRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CreateAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateAccountUseCase.class);

    private final AccountRepository accountRepository;

    public CreateAccountUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public AccountResponse execute(UUID userId, AccountRequest request) {
        log.info("Creating new account for user={} with type={}", userId, request.type());

        if (request.associatedAccountId() != null) {
            AccountEntity associatedAccount = accountRepository.findById(request.associatedAccountId())
                .orElseThrow(() -> new com.financeflow.shared.exception.NotFoundException("Account", request.associatedAccountId()));
            if (!associatedAccount.getUserId().equals(userId)) {
                throw new com.financeflow.shared.exception.DomainException("INVALID_ASSOCIATION", "Associated account does not belong to the user");
            }
            if (associatedAccount.getType() == com.financeflow.account.model.domain.AccountType.CREDIT_CARD) {
                throw new com.financeflow.shared.exception.DomainException("INVALID_ASSOCIATION", "A credit card cannot be associated with another credit card");
            }
        }

        Account domainAccount = new Account(
            UUID.randomUUID(),
            userId,
            request.name(),
            request.type(),
            request.bank(),
            request.balance(),
            request.creditLimit(),
            request.closingDay(),
            request.dueDay(),
            request.associatedAccountId(),
            AccountStatus.ACTIVE,
            null,
            null
        );

        AccountEntity entity = AccountMapper.toEntity(domainAccount);
        AccountEntity saved = accountRepository.save(entity);

        log.info("Account created successfully with id={}", saved.getId());
        Account savedDomain = AccountMapper.toDomain(saved);

        return new AccountResponse(
            savedDomain.id(),
            savedDomain.userId(),
            savedDomain.name(),
            savedDomain.type(),
            savedDomain.bank(),
            savedDomain.balance(),
            savedDomain.creditLimit(),
            savedDomain.closingDay(),
            savedDomain.dueDay(),
            savedDomain.associatedAccountId(),
            savedDomain.status()
        );
    }
}
