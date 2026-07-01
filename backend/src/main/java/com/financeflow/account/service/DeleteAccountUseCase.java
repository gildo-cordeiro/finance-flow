package com.financeflow.account.service;

import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.transaction.repository.TransactionRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeleteAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(DeleteAccountUseCase.class);
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public DeleteAccountUseCase(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public void execute(UUID userId, UUID accountId) {
        log.info("Deleting account={} for user={}", accountId, userId);

        AccountEntity entity = accountRepository.findById(accountId)
            .orElseThrow(() -> new NotFoundException("Account", accountId));

        if (!entity.getUserId().equals(userId)) {
            throw new ForbiddenException("Account does not belong to the authenticated user");
        }

        boolean hasTransactions = transactionRepository.existsByAccountId(accountId);
        if (hasTransactions) {
            throw new BusinessException("ACCOUNT_HAS_TRANSACTIONS",
                "Cannot permanently delete an account with transactions. Archive it instead.");
        }

        accountRepository.delete(entity);
        log.info("Account={} permanently deleted", accountId);
    }
}
