package com.financeflow.transaction.service;

import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.TransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.Transaction;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.model.mapper.TransactionMapper;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UpdateTransactionUseCase {

    private static final Logger log = LoggerFactory.getLogger(UpdateTransactionUseCase.class);

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final com.financeflow.couple.repository.CoupleRepository coupleRepository;

    public UpdateTransactionUseCase(
        TransactionRepository transactionRepository,
        AccountRepository accountRepository,
        CategoryRepository categoryRepository,
        com.financeflow.couple.repository.CoupleRepository coupleRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.coupleRepository = coupleRepository;
    }

    public TransactionResponse execute(UUID userId, UUID transactionId, TransactionRequest request, String mode) {
        log.info("Updating transaction id={} for user={}, mode={}", transactionId, userId, mode);

        TransactionEntity target = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new NotFoundException("Transaction", transactionId));

        if (!target.getUserId().equals(userId)) {
            throw new ValidationException("id", "Transaction does not belong to the user");
        }

        AccountEntity newAccount = accountRepository.findById(request.accountId())
            .orElseThrow(() -> new NotFoundException("Account", request.accountId()));

        if (!newAccount.getUserId().equals(userId)) {
            throw new ValidationException("accountId", "Account does not belong to the user");
        }

        CategoryEntity newCategory = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new NotFoundException("Category", request.categoryId()));

        if (newCategory.getUserId() != null) {
            UUID ownerId = newCategory.getUserId();
            UUID partnerId = null;
            if (request.visibility() == com.financeflow.transaction.model.domain.TransactionVisibility.SHARED) {
                com.financeflow.couple.model.domain.Couple couple = coupleRepository.findActiveByUserId(userId).orElse(null);
                if (couple != null) {
                    partnerId = couple.user1Id().equals(userId) ? couple.user2Id() : couple.user1Id();
                }
            }

            boolean isUserOrPartner = ownerId.equals(userId) || (partnerId != null && ownerId.equals(partnerId));
            if (!isUserOrPartner) {
                throw new ValidationException("categoryId", "Category does not belong to the user or partner");
            }

            if (request.visibility() == com.financeflow.transaction.model.domain.TransactionVisibility.SHARED) {
                if (newCategory.getVisibility() != com.financeflow.transaction.model.domain.TransactionVisibility.SHARED) {
                    throw new ValidationException("categoryId", "Only couple categories can be used for couple transactions");
                }
            } else {
                if (newCategory.getVisibility() != com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL) {
                    throw new ValidationException("categoryId", "Only personal categories can be used for personal transactions");
                }
                if (!ownerId.equals(userId)) {
                    throw new ValidationException("categoryId", "Personal transactions cannot use partner categories");
                }
            }
        }

        // Calculate competence date and due date for the target transaction
        LocalDate competenceDate = calculateCompetenceDate(newAccount, request);
        LocalDate dueDate = calculateDueDate(newAccount, request, competenceDate);

        if ("ALL".equalsIgnoreCase(mode)) {
            if (target.getInstallmentGroupId() != null) {
                updateInstallmentGroup(target, request, newAccount, newCategory);
            } else if (target.getRecurrenceGroupId() != null) {
                updateRecurrenceGroup(target, request, newAccount, newCategory);
            } else {
                updateTargetTransaction(target, request, newAccount, newCategory, competenceDate, dueDate);
            }
        } else {
            updateTargetTransaction(target, request, newAccount, newCategory, competenceDate, dueDate);
        }

        Transaction savedTarget = TransactionMapper.toDomain(transactionRepository.findById(transactionId).get());
        return mapToResponse(savedTarget);
    }

    private void updateInstallmentGroup(
        TransactionEntity target,
        TransactionRequest request,
        AccountEntity newAccount,
        CategoryEntity newCategory
    ) {
        UUID groupId = target.getInstallmentGroupId();
        log.info("Updating installment group id={}", groupId);
        List<TransactionEntity> group = transactionRepository.findByInstallmentGroupId(groupId);

        for (TransactionEntity t : group) {
            if (t.getId().equals(target.getId())) {
                LocalDate competenceDate = calculateCompetenceDate(newAccount, request);
                LocalDate dueDate = calculateDueDate(newAccount, request, competenceDate);
                updateTargetTransaction(t, request, newAccount, newCategory, competenceDate, dueDate);
            } else {
                String instDescription = request.description() + " (" + t.getInstallmentNumber() + "/" + t.getTotalInstallments() + ")";
                updateSingleTransaction(t, request, newAccount, newCategory, request.amount(), instDescription);
            }
        }
    }

    private void updateRecurrenceGroup(
        TransactionEntity target,
        TransactionRequest request,
        AccountEntity newAccount,
        CategoryEntity newCategory
    ) {
        UUID groupId = target.getRecurrenceGroupId();
        log.info("Updating recurrence group id={}", groupId);
        List<TransactionEntity> group = transactionRepository.findByRecurrenceGroupId(groupId);

        for (TransactionEntity t : group) {
            if (t.getId().equals(target.getId())) {
                LocalDate competenceDate = calculateCompetenceDate(newAccount, request);
                LocalDate dueDate = calculateDueDate(newAccount, request, competenceDate);
                updateTargetTransaction(t, request, newAccount, newCategory, competenceDate, dueDate);
            } else {
                updateSingleTransaction(t, request, newAccount, newCategory, request.amount(), request.description());
            }
        }
    }

    private void updateSingleTransaction(
        TransactionEntity t,
        TransactionRequest request,
        AccountEntity newAccount,
        CategoryEntity newCategory,
        BigDecimal newAmount,
        String newDescription
    ) {
        // Revert balance of old state if paid
        if (t.getStatus() == TransactionStatus.PAID) {
            AccountEntity oldAccount = accountRepository.findById(t.getAccountId())
                .orElseThrow(() -> new NotFoundException("Account", t.getAccountId()));
            if (t.getType() == TransactionType.INCOME) {
                oldAccount.setBalance(oldAccount.getBalance().subtract(t.getAmount()));
            } else {
                oldAccount.setBalance(oldAccount.getBalance().add(t.getAmount()));
            }
            accountRepository.save(oldAccount);
        }

        // Set new fields
        t.setDescription(newDescription);
        t.setAmount(newAmount);
        t.setCategoryId(newCategory.getId());
        t.setAccountId(newAccount.getId());
        t.setType(request.type());
        t.setVisibility(request.visibility());

        // Apply balance of new state if paid
        if (t.getStatus() == TransactionStatus.PAID) {
            if (t.getType() == TransactionType.INCOME) {
                newAccount.setBalance(newAccount.getBalance().add(t.getAmount()));
            } else {
                newAccount.setBalance(newAccount.getBalance().subtract(t.getAmount()));
            }
            accountRepository.save(newAccount);
        }

        t.setUpdatedAt(Instant.now());
        transactionRepository.save(t);
    }

    private void updateTargetTransaction(
        TransactionEntity target,
        TransactionRequest request,
        AccountEntity newAccount,
        CategoryEntity newCategory,
        LocalDate competenceDate,
        LocalDate dueDate
    ) {
        // Revert balance of old state if paid
        if (target.getStatus() == TransactionStatus.PAID) {
            AccountEntity oldAccount = accountRepository.findById(target.getAccountId())
                .orElseThrow(() -> new NotFoundException("Account", target.getAccountId()));
            if (target.getType() == TransactionType.INCOME) {
                oldAccount.setBalance(oldAccount.getBalance().subtract(target.getAmount()));
            } else {
                oldAccount.setBalance(oldAccount.getBalance().add(target.getAmount()));
            }
            accountRepository.save(oldAccount);
        }

        // Set new fields
        String description = request.description();
        if (target.getInstallmentGroupId() != null) {
            description = request.description() + " (" + target.getInstallmentNumber() + "/" + target.getTotalInstallments() + ")";
        }
        target.setDescription(description);
        target.setAmount(request.amount());
        target.setCategoryId(newCategory.getId());
        target.setAccountId(newAccount.getId());
        target.setType(request.type());
        target.setVisibility(request.visibility());
        target.setCompetenceDate(competenceDate);
        target.setDueDate(dueDate);

        // Status validation
        if (request.status() == TransactionStatus.PAID && request.paymentDate() == null) {
            throw new ValidationException("paymentDate", "Payment date is required when transaction status is PAID");
        }
        if (request.status() != TransactionStatus.PAID && request.paymentDate() != null) {
            throw new ValidationException("paymentDate", "Payment date must be null when transaction status is not PAID");
        }

        LocalDate paymentDate = request.paymentDate();
        if (newAccount.getType() == AccountType.CREDIT_CARD && request.status() == TransactionStatus.PAID) {
            paymentDate = dueDate;
        }
        target.setPaymentDate(paymentDate);
        target.setStatus(request.status());

        // Apply balance of new state if paid
        if (target.getStatus() == TransactionStatus.PAID) {
            if (target.getType() == TransactionType.INCOME) {
                newAccount.setBalance(newAccount.getBalance().add(target.getAmount()));
            } else {
                newAccount.setBalance(newAccount.getBalance().subtract(target.getAmount()));
            }
            accountRepository.save(newAccount);
        }

        target.setUpdatedAt(Instant.now());
        transactionRepository.save(target);
    }

    private TransactionResponse mapToResponse(Transaction savedDomain) {
        return new TransactionResponse(
            savedDomain.id(),
            savedDomain.userId(),
            savedDomain.accountId(),
            savedDomain.categoryId(),
            savedDomain.description(),
            savedDomain.amount(),
            savedDomain.type(),
            savedDomain.competenceDate(),
            savedDomain.dueDate(),
            savedDomain.paymentDate(),
            savedDomain.status(),
            savedDomain.visibility(),
            savedDomain.installmentGroupId(),
            savedDomain.installmentNumber(),
            savedDomain.totalInstallments(),
            savedDomain.isRecurring(),
            savedDomain.recurrenceRule(),
            savedDomain.recurrenceGroupId()
        );
    }

    private LocalDate calculateCompetenceDate(AccountEntity account, TransactionRequest request) {
        if (request.competenceDate() != null) {
            return request.competenceDate().withDayOfMonth(1);
        }

        LocalDate purchaseDate = request.dueDate();

        if (account.getType() == AccountType.CREDIT_CARD && account.getClosingDay() != null) {
            int closingDay = account.getClosingDay();
            int dayOfPurchase = purchaseDate.getDayOfMonth();

            if (dayOfPurchase <= closingDay) {
                return purchaseDate.withDayOfMonth(1);
            } else {
                return purchaseDate.plusMonths(1).withDayOfMonth(1);
            }
        }

        return purchaseDate.withDayOfMonth(1);
    }

    private LocalDate calculateDueDate(AccountEntity account, TransactionRequest request, LocalDate competenceDate) {
        if (account.getType() != AccountType.CREDIT_CARD || account.getDueDay() == null || account.getClosingDay() == null) {
            return request.dueDate();
        }

        int closingDay = account.getClosingDay();
        int dueDay = account.getDueDay();
        int gap = dueDay - closingDay;

        if (gap < 0 || gap < 7) {
            LocalDate nextMonth = competenceDate.plusMonths(1);
            return safeDateOf(nextMonth.getYear(), nextMonth.getMonthValue(), dueDay);
        } else {
            return safeDateOf(competenceDate.getYear(), competenceDate.getMonthValue(), dueDay);
        }
    }

    private LocalDate safeDateOf(int year, int month, int targetDay) {
        LocalDate temp = LocalDate.of(year, month, 1);
        int length = temp.lengthOfMonth();
        int day = Math.min(targetDay, length);
        return LocalDate.of(year, month, day);
    }
}
