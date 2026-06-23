package com.financeflow.transaction.model.mapper;

import com.financeflow.transaction.model.domain.Transaction;
import com.financeflow.transaction.model.entity.TransactionEntity;

public final class TransactionMapper {

    private TransactionMapper() {
        // utility class
    }

    public static Transaction toDomain(TransactionEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Transaction(
            entity.getId(),
            entity.getUserId(),
            entity.getAccountId(),
            entity.getCategoryId(),
            entity.getDescription(),
            entity.getAmount(),
            entity.getType(),
            entity.getCompetenceDate(),
            entity.getDueDate(),
            entity.getPaymentDate(),
            entity.getStatus(),
            entity.getVisibility(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static TransactionEntity toEntity(Transaction domain) {
        if (domain == null) {
            return null;
        }
        return new TransactionEntity(
            domain.id(),
            domain.userId(),
            domain.accountId(),
            domain.categoryId(),
            domain.description(),
            domain.amount(),
            domain.type(),
            domain.competenceDate(),
            domain.dueDate(),
            domain.paymentDate(),
            domain.status(),
            domain.visibility(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }
}
