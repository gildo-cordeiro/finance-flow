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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CreateTransactionUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateTransactionUseCase.class);

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final com.financeflow.couple.repository.CoupleRepository coupleRepository;

    public CreateTransactionUseCase(
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

    public TransactionResponse execute(UUID userId, TransactionRequest request) {
        log.info("Creating manual transaction for user={}, amount={}, type={}", userId, request.amount(), request.type());

        // Validate account and user ownership
        AccountEntity account = accountRepository.findById(request.accountId())
            .orElseThrow(() -> new NotFoundException("Account", request.accountId()));

        if (!account.getUserId().equals(userId)) {
            throw new ValidationException("accountId", "Account does not belong to the user");
        }

        // Validate category and ownership (or default category)
        CategoryEntity category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new NotFoundException("Category", request.categoryId()));

        if (category.getUserId() != null) {
            UUID ownerId = category.getUserId();
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
                if (category.getVisibility() != com.financeflow.transaction.model.domain.TransactionVisibility.SHARED) {
                    throw new ValidationException("categoryId", "Only couple categories can be used for couple transactions");
                }
            } else {
                if (category.getVisibility() != com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL) {
                    throw new ValidationException("categoryId", "Only personal categories can be used for personal transactions");
                }
                if (!ownerId.equals(userId)) {
                    throw new ValidationException("categoryId", "Personal transactions cannot use partner categories");
                }
            }
        }

        // Calculate competence date
        LocalDate competenceDate = calculateCompetenceDate(account, request);

        // Calculate due date (recalculated for credit cards)
        LocalDate dueDate = calculateDueDate(account, request, competenceDate);

        // Status validation: payment date is required if status is PAID
        if (request.status() == TransactionStatus.PAID && request.paymentDate() == null) {
            throw new ValidationException("paymentDate", "Payment date is required when transaction status is PAID");
        }
        if (request.status() != TransactionStatus.PAID && request.paymentDate() != null) {
            throw new ValidationException("paymentDate", "Payment date must be null when transaction status is not PAID");
        }

        if (request.totalInstallments() != null && request.totalInstallments() <= 0) {
            throw new ValidationException("totalInstallments", "Total installments must be greater than zero");
        }

        if (request.totalInstallments() != null && request.totalInstallments() > 1) {
            return handleInstallmentCreation(userId, request, account, competenceDate);
        } else if (request.isRecurring() != null && request.isRecurring()) {
            return handleRecurringCreation(userId, request, account, competenceDate);
        } else {
            return handleSingleCreation(userId, request, account, competenceDate, dueDate);
        }
    }

    private TransactionResponse handleSingleCreation(
        UUID userId,
        TransactionRequest request,
        AccountEntity account,
        LocalDate competenceDate,
        LocalDate dueDate
    ) {
        // For credit cards, the payment date (if PAID) must also be the invoice due date
        LocalDate paymentDate = request.paymentDate();
        if (account.getType() == AccountType.CREDIT_CARD && request.status() == TransactionStatus.PAID) {
            paymentDate = dueDate;
        }

        Transaction transaction = new Transaction(
            UUID.randomUUID(),
            userId,
            request.accountId(),
            request.categoryId(),
            request.description(),
            request.amount(),
            request.type(),
            competenceDate,
            dueDate,
            paymentDate,
            request.status(),
            request.visibility(),
            null,
            null,
            null,
            false,
            null,
            null,
            null,
            null
        );

        if (transaction.status() == TransactionStatus.PAID) {
            updateAccountBalance(account, transaction.amount(), transaction.type());
        }

        TransactionEntity entity = TransactionMapper.toEntity(transaction);
        TransactionEntity saved = transactionRepository.save(entity);
        log.info("Transaction created successfully with id={}", saved.getId());
        return mapToResponse(TransactionMapper.toDomain(saved));
    }

    private TransactionResponse handleInstallmentCreation(
        UUID userId,
        TransactionRequest request,
        AccountEntity account,
        LocalDate competenceDate
    ) {
        UUID installmentGroupId = UUID.randomUUID();
        int totalInstallments = request.totalInstallments();
        BigDecimal totalAmount = request.amount();

        BigDecimal installmentAmount = totalAmount.divide(BigDecimal.valueOf(totalInstallments), 2, RoundingMode.HALF_UP);
        BigDecimal firstInstallmentAmount = totalAmount.subtract(installmentAmount.multiply(BigDecimal.valueOf(totalInstallments - 1)));

        TransactionResponse firstResponse = null;

        for (int i = 1; i <= totalInstallments; i++) {
            BigDecimal amount = (i == 1) ? firstInstallmentAmount : installmentAmount;
            LocalDate instCompetenceDate = competenceDate.plusMonths(i - 1);
            LocalDate instDueDate = calculateDueDate(account, request, instCompetenceDate);

            TransactionStatus status = (i == 1) ? request.status() : TransactionStatus.PLANNED;
            LocalDate paymentDate = null;
            if (i == 1) {
                paymentDate = request.paymentDate();
                if (account.getType() == AccountType.CREDIT_CARD && status == TransactionStatus.PAID) {
                    paymentDate = instDueDate;
                }
            }

            Transaction transaction = new Transaction(
                UUID.randomUUID(),
                userId,
                request.accountId(),
                request.categoryId(),
                request.description() + " (" + i + "/" + totalInstallments + ")",
                amount,
                request.type(),
                instCompetenceDate,
                instDueDate,
                paymentDate,
                status,
                request.visibility(),
                installmentGroupId,
                i,
                totalInstallments,
                false,
                null,
                null,
                null,
                null
            );

            if (transaction.status() == TransactionStatus.PAID) {
                updateAccountBalance(account, transaction.amount(), transaction.type());
            }

            TransactionEntity entity = TransactionMapper.toEntity(transaction);
            TransactionEntity saved = transactionRepository.save(entity);

            if (i == 1) {
                firstResponse = mapToResponse(TransactionMapper.toDomain(saved));
            }
        }

        log.info("Created {} installments under group id={}", totalInstallments, installmentGroupId);
        return firstResponse;
    }

    private TransactionResponse handleRecurringCreation(
        UUID userId,
        TransactionRequest request,
        AccountEntity account,
        LocalDate competenceDate
    ) {
        UUID recurrenceGroupId = UUID.randomUUID();
        String recurrenceRule = request.recurrenceRule();
        if (recurrenceRule == null || recurrenceRule.isBlank()) {
            recurrenceRule = "MONTHLY";
        }

        TransactionResponse firstResponse = null;

        for (int i = 1; i <= 12; i++) {
            LocalDate recCompetenceDate = competenceDate.plusMonths(i - 1);
            LocalDate recDueDate;
            if (account.getType() == AccountType.CREDIT_CARD) {
                recDueDate = calculateDueDate(account, request, recCompetenceDate);
            } else {
                recDueDate = request.dueDate().plusMonths(i - 1);
            }

            TransactionStatus status = (i == 1) ? request.status() : TransactionStatus.PLANNED;
            LocalDate paymentDate = null;
            if (i == 1) {
                paymentDate = request.paymentDate();
                if (account.getType() == AccountType.CREDIT_CARD && status == TransactionStatus.PAID) {
                    paymentDate = recDueDate;
                }
            }

            Transaction transaction = new Transaction(
                UUID.randomUUID(),
                userId,
                request.accountId(),
                request.categoryId(),
                request.description(),
                request.amount(),
                request.type(),
                recCompetenceDate,
                recDueDate,
                paymentDate,
                status,
                request.visibility(),
                null,
                null,
                null,
                true,
                recurrenceRule,
                recurrenceGroupId,
                null,
                null
            );

            if (transaction.status() == TransactionStatus.PAID) {
                updateAccountBalance(account, transaction.amount(), transaction.type());
            }

            TransactionEntity entity = TransactionMapper.toEntity(transaction);
            TransactionEntity saved = transactionRepository.save(entity);

            if (i == 1) {
                firstResponse = mapToResponse(TransactionMapper.toDomain(saved));
            }
        }

        log.info("Created 12 recurring occurrences under group id={}", recurrenceGroupId);
        return firstResponse;
    }

    private void updateAccountBalance(AccountEntity account, BigDecimal amount, TransactionType type) {
        if (type == TransactionType.INCOME) {
            account.setBalance(account.getBalance().add(amount));
        } else {
            account.setBalance(account.getBalance().subtract(amount));
        }
        accountRepository.save(account);
        log.info("Account balance updated. New balance={}", account.getBalance());
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
        // If the user specified a competence date, use it (normalized to the first day of the month)
        if (request.competenceDate() != null) {
            return request.competenceDate().withDayOfMonth(1);
        }

        // Otherwise, use the purchase date (which we default to the dueDate of the transaction, or current date if dueDate is missing)
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
