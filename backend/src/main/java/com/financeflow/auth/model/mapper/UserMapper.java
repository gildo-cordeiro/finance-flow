package com.financeflow.auth.model.mapper;

import com.financeflow.auth.model.domain.User;
import com.financeflow.auth.model.entity.UserEntity;

public final class UserMapper {

    private UserMapper() {
        // utility class
    }

    public static User toDomain(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        return new User(
            entity.getId(),
            entity.getEmail(),
            entity.getPassword(),
            entity.getName(),
            entity.getTimeZone(),
            entity.getCurrency(),
            entity.getBudgetClosingDay(),
            entity.getDateFormat(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static UserEntity toEntity(User domain) {
        if (domain == null) {
            return null;
        }
        return new UserEntity(
            domain.id(),
            domain.email(),
            domain.password(),
            domain.name(),
            domain.timeZone(),
            domain.currency(),
            domain.budgetClosingDay(),
            domain.dateFormat(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }
}
