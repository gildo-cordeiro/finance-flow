package com.financeflow.goals.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.domain.GoalStatus;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeleteGoalUseCase {

    private final GoalRepository goalRepository;
    private final CoupleRepository coupleRepository;

    public DeleteGoalUseCase(GoalRepository goalRepository, CoupleRepository coupleRepository) {
        this.goalRepository = goalRepository;
        this.coupleRepository = coupleRepository;
    }

    public void execute(UUID userId, UUID goalId) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new NotFoundException("Goal", goalId));

        validateOwnership(userId, goal);

        Goal archived = new Goal(
            goal.id(),
            goal.userId(),
            goal.coupleId(),
            goal.name(),
            goal.description(),
            goal.targetAmount(),
            goal.currentAmount(),
            goal.deadline(),
            GoalStatus.ARCHIVED,
            goal.createdAt(),
            Instant.now()
        );

        goalRepository.save(archived);
    }

    private void validateOwnership(UUID userId, Goal goal) {
        if (goal.userId() != null) {
            if (!goal.userId().equals(userId)) {
                throw new ForbiddenException("Access denied to this goal");
            }
        } else if (goal.coupleId() != null) {
            Couple couple = coupleRepository.findActiveByUserId(userId).orElse(null);
            if (couple == null || !couple.id().equals(goal.coupleId())) {
                throw new ForbiddenException("Access denied to this couple goal");
            }
        }
    }
}
