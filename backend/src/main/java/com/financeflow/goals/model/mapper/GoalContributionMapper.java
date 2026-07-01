package com.financeflow.goals.model.mapper;

import com.financeflow.goals.model.domain.GoalContribution;
import com.financeflow.goals.model.entity.GoalContributionEntity;

public final class GoalContributionMapper {

    private GoalContributionMapper() {
        // utility class
    }

    public static GoalContribution toDomain(GoalContributionEntity entity) {
        if (entity == null) {
            return null;
        }
        return new GoalContribution(
            entity.getId(),
            entity.getGoalId(),
            entity.getUserId(),
            entity.getAmount(),
            entity.getNote(),
            entity.getContributionDate(),
            entity.getCreatedAt()
        );
    }

    public static GoalContributionEntity toEntity(GoalContribution domain) {
        if (domain == null) {
            return null;
        }
        return GoalContributionEntity.builder()
            .id(domain.id())
            .goalId(domain.goalId())
            .userId(domain.userId())
            .amount(domain.amount())
            .note(domain.note())
            .contributionDate(domain.contributionDate())
            .createdAt(domain.createdAt())
            .build();
    }
}
