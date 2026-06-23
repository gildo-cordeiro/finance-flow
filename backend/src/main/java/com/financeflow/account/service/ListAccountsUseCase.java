package com.financeflow.account.service;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.mapper.AccountMapper;
import com.financeflow.account.repository.AccountRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ListAccountsUseCase {

    private final AccountRepository accountRepository;

    public ListAccountsUseCase(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<AccountResponse> execute(UUID userId) {
        return accountRepository.findAllByUserId(userId)
            .stream()
            .map(AccountMapper::toDomain)
            .map(domain -> new AccountResponse(
                domain.id(),
                domain.userId(),
                domain.name(),
                domain.type(),
                domain.bank(),
                domain.balance(),
                domain.creditLimit(),
                domain.closingDay(),
                domain.dueDay()
            ))
            .toList();
    }
}
