package com.financeflow.transaction.service;

import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.TransactionRepository;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeleteTransactionUseCase {

    private static final Logger log = LoggerFactory.getLogger(DeleteTransactionUseCase.class);

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public DeleteTransactionUseCase(
        TransactionRepository transactionRepository,
        AccountRepository accountRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    public void execute(UUID userId, UUID transactionId, String mode) {
        log.info("Deleting transaction id={} for user={}, mode={}", transactionId, userId, mode);

        TransactionEntity target = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new NotFoundException("Transaction", transactionId));

        if (!target.getUserId().equals(userId)) {
            throw new ValidationException("id", "Transaction does not belong to the user");
        }

        if ("ALL".equalsIgnoreCase(mode)) {
            if (target.getInstallmentGroupId() != null) {
                deleteInstallmentGroup(target);
            } else if (target.getRecurrenceGroupId() != null) {
                deleteRecurrenceGroup(target);
            } else {
                deleteSingle(target);
            }
        } else {
            deleteSingle(target);
        }
    }

    private void deleteInstallmentGroup(TransactionEntity target) {
        UUID groupId = target.getInstallmentGroupId();
        log.info("Deleting installment group id={}", groupId);
        List<TransactionEntity> group = transactionRepository.findByInstallmentGroupId(groupId);
        for (TransactionEntity t : group) {
            revertBalanceIfPaid(t);
        }
        transactionRepository.deleteAll(group);
    }

    private void deleteRecurrenceGroup(TransactionEntity target) {
        UUID groupId = target.getRecurrenceGroupId();
        log.info("Deleting recurrence group id={}", groupId);
        List<TransactionEntity> group = transactionRepository.findByRecurrenceGroupId(groupId);
        for (TransactionEntity t : group) {
            revertBalanceIfPaid(t);
        }
        transactionRepository.deleteAll(group);
    }

    private void deleteSingle(TransactionEntity target) {
        revertBalanceIfPaid(target);
        transactionRepository.delete(target);
    }

    private void revertBalanceIfPaid(TransactionEntity t) {
        if (t.getStatus() == TransactionStatus.PAID) {
            AccountEntity account = accountRepository.findById(t.getAccountId())
                .orElseThrow(() -> new NotFoundException("Account", t.getAccountId()));
            if (t.getType() == TransactionType.INCOME) {
                account.setBalance(account.getBalance().subtract(t.getAmount()));
            } else {
                account.setBalance(account.getBalance().add(t.getAmount()));
            }
            accountRepository.save(account);
            log.info("Reverted balance for deleted transaction id={}, new balance={}", t.getId(), account.getBalance());
        }
    }
}
