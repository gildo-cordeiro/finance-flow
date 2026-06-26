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

    public CreateTransactionUseCase(
        TransactionRepository transactionRepository,
        AccountRepository accountRepository,
        CategoryRepository categoryRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
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

        if (category.getUserId() != null && !category.getUserId().equals(userId)) {
            throw new ValidationException("categoryId", "Category does not belong to the user");
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

        // For credit cards, the payment date (if PAID) must also be the invoice due date
        LocalDate paymentDate = request.paymentDate();
        if (account.getType() == AccountType.CREDIT_CARD && request.status() == TransactionStatus.PAID) {
            paymentDate = dueDate;
        }

        // Build transaction domain object
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
            null
        );

        // Update account balance if transaction status is PAID
        if (transaction.status() == TransactionStatus.PAID) {
            if (transaction.type() == TransactionType.INCOME) {
                account.setBalance(account.getBalance().add(transaction.amount()));
            } else {
                account.setBalance(account.getBalance().subtract(transaction.amount()));
            }
            accountRepository.save(account);
            log.info("Account balance updated. New balance={}", account.getBalance());
        }

        // Save transaction
        TransactionEntity entity = TransactionMapper.toEntity(transaction);
        TransactionEntity saved = transactionRepository.save(entity);

        log.info("Transaction created successfully with id={}", saved.getId());
        Transaction savedDomain = TransactionMapper.toDomain(saved);

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
            savedDomain.visibility()
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
