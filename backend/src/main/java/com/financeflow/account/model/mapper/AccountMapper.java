package com.financeflow.account.model.mapper;

import com.financeflow.account.model.domain.Account;
import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.entity.AccountEntity;

public final class AccountMapper {

    private AccountMapper() {
        // utility class
    }

    public static Account toDomain(AccountEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Account(
            entity.getId(),
            entity.getUserId(),
            entity.getName(),
            entity.getType(),
            entity.getBank(),
            entity.getBalance(),
            entity.getCreditLimit(),
            entity.getClosingDay(),
            entity.getDueDay(),
            entity.getAssociatedAccountId(),
            entity.getStatus() != null ? entity.getStatus() : AccountStatus.ACTIVE,
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static AccountEntity toEntity(Account domain) {
        if (domain == null) {
            return null;
        }
        return new AccountEntity(
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
            domain.status(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }
}
