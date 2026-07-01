package com.financeflow.account.service;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.mapper.AccountMapper;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ListAccountsUseCase {

    private final AccountRepository accountRepository;
    private final CoupleRepository coupleRepository;

    public ListAccountsUseCase(AccountRepository accountRepository, CoupleRepository coupleRepository) {
        this.accountRepository = accountRepository;
        this.coupleRepository = coupleRepository;
    }

    public List<AccountResponse> execute(UUID userId) {
        return execute(userId, "PERSONAL");
    }

    public List<AccountResponse> execute(UUID userId, String viewContext) {
        List<AccountEntity> accounts;
        if ("COUPLE".equalsIgnoreCase(viewContext)) {
            Couple couple = coupleRepository.findActiveByUserId(userId).orElse(null);
            if (couple != null) {
                UUID partnerId = couple.user1Id().equals(userId) ? couple.user2Id() : couple.user1Id();
                List<AccountEntity> ownAccounts = accountRepository.findAllByUserId(userId);
                List<AccountEntity> partnerAccounts = accountRepository.findAllByUserId(partnerId);
                accounts = new ArrayList<>();
                accounts.addAll(ownAccounts);
                accounts.addAll(partnerAccounts);
            } else {
                accounts = accountRepository.findAllByUserId(userId);
            }
        } else {
            accounts = accountRepository.findAllByUserId(userId);
        }

        return accounts.stream()
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
                domain.dueDay(),
                domain.associatedAccountId(),
                domain.status()
            ))
            .toList();
    }
}
