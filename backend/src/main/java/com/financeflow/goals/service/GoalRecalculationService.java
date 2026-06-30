package com.financeflow.goals.service;

import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.domain.GoalStatus;
import com.financeflow.goals.repository.GoalContributionRepository;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class GoalRecalculationService {

    private final GoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;

    public GoalRecalculationService(
        GoalRepository goalRepository,
        GoalContributionRepository contributionRepository
    ) {
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
    }

    public void recalculate(UUID goalId) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new NotFoundException("Goal", goalId));

        BigDecimal currentAmount = contributionRepository.findAllByGoalId(goalId).stream()
            .map(c -> c.amount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        GoalStatus status = goal.status();
        if (status != GoalStatus.ARCHIVED) {
            if (currentAmount.compareTo(goal.targetAmount()) >= 0) {
                status = GoalStatus.COMPLETED;
            } else {
                status = GoalStatus.ACTIVE;
            }
        }

        Goal updatedGoal = new Goal(
            goal.id(),
            goal.userId(),
            goal.coupleId(),
            goal.name(),
            goal.description(),
            goal.targetAmount(),
            currentAmount,
            goal.deadline(),
            status,
            goal.createdAt(),
            java.time.Instant.now()
        );

        goalRepository.save(updatedGoal);
    }
}
