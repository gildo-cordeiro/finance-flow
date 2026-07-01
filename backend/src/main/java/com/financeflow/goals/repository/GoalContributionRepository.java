package com.financeflow.goals.repository;

import com.financeflow.goals.model.domain.GoalContribution;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalContributionRepository {
    Optional<GoalContribution> findById(UUID id);
    List<GoalContribution> findAllByGoalId(UUID goalId);
    GoalContribution save(GoalContribution contribution);
    void deleteById(UUID id);
}
