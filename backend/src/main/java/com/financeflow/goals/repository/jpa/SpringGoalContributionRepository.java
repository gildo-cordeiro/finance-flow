package com.financeflow.goals.repository.jpa;

import com.financeflow.goals.model.entity.GoalContributionEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringGoalContributionRepository extends JpaRepository<GoalContributionEntity, UUID> {
    List<GoalContributionEntity> findAllByGoalId(UUID goalId);
}
