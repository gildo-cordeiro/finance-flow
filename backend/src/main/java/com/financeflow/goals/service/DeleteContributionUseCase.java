package com.financeflow.goals.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.domain.GoalContribution;
import com.financeflow.goals.repository.GoalContributionRepository;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeleteContributionUseCase {

    private final GoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;
    private final CoupleRepository coupleRepository;
    private final GoalRecalculationService recalculationService;

    public DeleteContributionUseCase(
        GoalRepository goalRepository,
        GoalContributionRepository contributionRepository,
        CoupleRepository coupleRepository,
        GoalRecalculationService recalculationService
    ) {
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
        this.coupleRepository = coupleRepository;
        this.recalculationService = recalculationService;
    }

    public void execute(UUID userId, UUID goalId, UUID contributionId) {
        GoalContribution contribution = contributionRepository.findById(contributionId)
            .orElseThrow(() -> new NotFoundException("GoalContribution", contributionId));

        if (!contribution.goalId().equals(goalId)) {
            throw new NotFoundException("GoalContribution", contributionId);
        }

        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new NotFoundException("Goal", goalId));

        validateOwnership(userId, goal);

        contributionRepository.deleteById(contributionId);

        recalculationService.recalculate(goalId);
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
