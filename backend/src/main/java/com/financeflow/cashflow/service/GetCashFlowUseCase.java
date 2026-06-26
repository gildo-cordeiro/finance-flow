package com.financeflow.cashflow.service;

import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.cashflow.dto.AccountBalanceInfo;
import com.financeflow.cashflow.dto.CashFlowDailyPoint;
import com.financeflow.cashflow.dto.CashFlowPeriodTightness;
import com.financeflow.cashflow.dto.CashFlowResponse;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.domain.Transaction;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.mapper.TransactionMapper;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GetCashFlowUseCase {

    private static final Logger log = LoggerFactory.getLogger(GetCashFlowUseCase.class);

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public GetCashFlowUseCase(
        AccountRepository accountRepository,
        TransactionRepository transactionRepository
    ) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public CashFlowResponse execute(UUID userId, LocalDate fromDate, LocalDate toDate) {
        log.info("Calculating cash flow projection for user={}, from={}, to={}", userId, fromDate, toDate);

        if (fromDate == null) {
            throw new ValidationException("fromDate", "From date is required");
        }
        if (toDate == null) {
            throw new ValidationException("toDate", "To date is required");
        }
        if (fromDate.isAfter(toDate)) {
            throw new ValidationException("toDate", "To date must be after or equal to from date");
        }

        // 1. Fetch user accounts
        List<AccountEntity> accounts = accountRepository.findAllByUserId(userId);
        Map<UUID, BigDecimal> currentBalances = accounts.stream()
            .collect(Collectors.toMap(AccountEntity::getId, AccountEntity::getBalance));
        Map<UUID, String> accountNames = accounts.stream()
            .collect(Collectors.toMap(AccountEntity::getId, AccountEntity::getName));

        // 2. Fetch relevant transactions
        List<Transaction> transactions = transactionRepository.findAllForCashFlow(userId, fromDate, toDate)
            .stream()
            .map(TransactionMapper::toDomain)
            .toList();

        List<Transaction> paidTransactions = transactions.stream()
            .filter(t -> t.status() == TransactionStatus.PAID)
            .toList();

        List<Transaction> unpaidTransactions = transactions.stream()
            .filter(t -> t.status() != TransactionStatus.PAID)
            .toList();

        // 3. Compute daily points
        List<CashFlowDailyPoint> dailyPoints = new ArrayList<>();
        LocalDate current = fromDate;

        while (!current.isAfter(toDate)) {
            LocalDate date = current;
            BigDecimal consolidatedBalance = BigDecimal.ZERO;
            Map<UUID, AccountBalanceInfo> accountBalances = new HashMap<>();

            // Calculate balance for each account on this day
            for (AccountEntity account : accounts) {
                UUID accountId = account.getId();
                BigDecimal currentBalance = currentBalances.getOrDefault(accountId, BigDecimal.ZERO);

                // Revert PAID transactions with paymentDate > date
                BigDecimal paidAfterDate = paidTransactions.stream()
                    .filter(t -> t.accountId().equals(accountId) && t.paymentDate().isAfter(date))
                    .map(t -> t.type() == TransactionType.INCOME ? t.amount() : t.amount().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Apply UNPAID transactions with dueDate <= date
                BigDecimal unpaidOnOrBeforeDate = unpaidTransactions.stream()
                    .filter(t -> t.accountId().equals(accountId) && !t.dueDate().isAfter(date))
                    .map(t -> t.type() == TransactionType.INCOME ? t.amount() : t.amount().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal projectedAccountBalance = currentBalance.subtract(paidAfterDate).add(unpaidOnOrBeforeDate);
                
                accountBalances.put(accountId, new AccountBalanceInfo(accountNames.get(accountId), projectedAccountBalance));
                consolidatedBalance = consolidatedBalance.add(projectedAccountBalance);
            }

            // Calculate daily income/expense (events occurring on this day)
            // PAID transactions paid on this day OR UNPAID transactions due on this day
            BigDecimal dailyIncome = transactions.stream()
                .filter(t -> (t.status() == TransactionStatus.PAID && date.equals(t.paymentDate()))
                    || (t.status() != TransactionStatus.PAID && date.equals(t.dueDate())))
                .filter(t -> t.type() == TransactionType.INCOME)
                .map(Transaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal dailyExpense = transactions.stream()
                .filter(t -> (t.status() == TransactionStatus.PAID && date.equals(t.paymentDate()))
                    || (t.status() != TransactionStatus.PAID && date.equals(t.dueDate())))
                .filter(t -> t.type() == TransactionType.EXPENSE)
                .map(Transaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            dailyPoints.add(new CashFlowDailyPoint(
                date,
                consolidatedBalance,
                dailyIncome,
                dailyExpense,
                accountBalances
            ));

            current = current.plusDays(1);
        }

        // 4. Identify tightness periods (contiguous days with negative consolidated balance)
        List<CashFlowPeriodTightness> tightnessPeriods = new ArrayList<>();
        LocalDate tightnessStart = null;
        BigDecimal minBalance = null;

        for (CashFlowDailyPoint point : dailyPoints) {
            BigDecimal bal = point.consolidatedBalance();
            LocalDate date = point.date();

            if (bal.compareTo(BigDecimal.ZERO) < 0) {
                if (tightnessStart == null) {
                    tightnessStart = date;
                    minBalance = bal;
                } else {
                    minBalance = minBalance.min(bal);
                }
            } else {
                if (tightnessStart != null) {
                    tightnessPeriods.add(new CashFlowPeriodTightness(
                        tightnessStart,
                        date.minusDays(1),
                        minBalance
                    ));
                    tightnessStart = null;
                    minBalance = null;
                }
            }
        }
        if (tightnessStart != null) {
            tightnessPeriods.add(new CashFlowPeriodTightness(
                tightnessStart,
                toDate,
                minBalance
            ));
        }

        return new CashFlowResponse(dailyPoints, tightnessPeriods);
    }
}
