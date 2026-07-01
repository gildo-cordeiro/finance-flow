package com.financeflow.goals.model.mapper;

import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.entity.GoalEntity;

public final class GoalMapper {

    private GoalMapper() {
        // utility class
    }

    public static Goal toDomain(GoalEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Goal(
            entity.getId(),
            entity.getUserId(),
            entity.getCoupleId(),
            entity.getName(),
            entity.getDescription(),
            entity.getTargetAmount(),
            entity.getCurrentAmount(),
            entity.getDeadline(),
            entity.getStatus(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static GoalEntity toEntity(Goal domain) {
        if (domain == null) {
            return null;
        }
        return GoalEntity.builder()
            .id(domain.id())
            .userId(domain.userId())
            .coupleId(domain.coupleId())
            .name(domain.name())
            .description(domain.description())
            .targetAmount(domain.targetAmount())
            .currentAmount(domain.currentAmount())
            .deadline(domain.deadline())
            .status(domain.status())
            .createdAt(domain.createdAt())
            .updatedAt(domain.updatedAt())
            .build();
    }
}
