package com.financeflow.goals.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.dto.GoalResponse;
import com.financeflow.goals.dto.UpdateGoalRequest;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UpdateGoalUseCase {

    private final GoalRepository goalRepository;
    private final CoupleRepository coupleRepository;
    private final GoalRecalculationService recalculationService;

    public UpdateGoalUseCase(
        GoalRepository goalRepository,
        CoupleRepository coupleRepository,
        GoalRecalculationService recalculationService
    ) {
        this.goalRepository = goalRepository;
        this.coupleRepository = coupleRepository;
        this.recalculationService = recalculationService;
    }

    public GoalResponse execute(UUID userId, UUID goalId, UpdateGoalRequest request) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new NotFoundException("Goal", goalId));

        validateOwnership(userId, goal);

        Goal updated = new Goal(
            goal.id(),
            goal.userId(),
            goal.coupleId(),
            request.name(),
            request.description(),
            request.targetAmount(),
            goal.currentAmount(),
            request.deadline(),
            goal.status(),
            goal.createdAt(),
            Instant.now()
        );

        Goal saved = goalRepository.save(updated);

        // Recalculate status in case target amount changed
        recalculationService.recalculate(goalId);

        // Fetch again to get updated status and amounts
        saved = goalRepository.findById(goalId).orElse(saved);

        return mapToResponse(saved);
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

    private GoalResponse mapToResponse(Goal goal) {
        return new GoalResponse(
            goal.id(),
            goal.userId(),
            goal.coupleId(),
            goal.name(),
            goal.description(),
            goal.targetAmount(),
            goal.currentAmount(),
            goal.deadline(),
            goal.status(),
            goal.createdAt(),
            goal.updatedAt()
        );
    }
}
