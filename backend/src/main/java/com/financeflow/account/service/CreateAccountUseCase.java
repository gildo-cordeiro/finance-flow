package com.financeflow.account.service;

import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.domain.Account;
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
            savedDomain.dueDay()
        );
    }
}
