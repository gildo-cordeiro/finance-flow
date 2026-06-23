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

        // Status validation: payment date is required if status is PAID
        if (request.status() == TransactionStatus.PAID && request.paymentDate() == null) {
            throw new ValidationException("paymentDate", "Payment date is required when transaction status is PAID");
        }
        if (request.status() != TransactionStatus.PAID && request.paymentDate() != null) {
            throw new ValidationException("paymentDate", "Payment date must be null when transaction status is not PAID");
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
            request.dueDate(),
            request.paymentDate(),
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
        // If the user specified a competence date, use it
        if (request.competenceDate() != null) {
            return request.competenceDate();
        }

        // Otherwise, use the purchase date (which we default to the dueDate of the transaction, or current date if dueDate is missing)
        LocalDate purchaseDate = request.dueDate();

        if (account.getType() == AccountType.CREDIT_CARD && account.getClosingDay() != null) {
            int closingDay = account.getClosingDay();
            int dayOfPurchase = purchaseDate.getDayOfMonth();

            if (dayOfPurchase <= closingDay) {
                return purchaseDate;
            } else {
                return purchaseDate.plusMonths(1);
            }
        }

        return purchaseDate;
    }
}
