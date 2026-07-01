package com.financeflow.goals.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.dto.CreateGoalRequest;
import com.financeflow.goals.dto.GoalResponse;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.domain.GoalContribution;
import com.financeflow.goals.model.domain.GoalStatus;
import com.financeflow.goals.repository.GoalContributionRepository;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.shared.exception.BusinessException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CreateGoalUseCase {

    private final GoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;
    private final CoupleRepository coupleRepository;
    private final GoalRecalculationService recalculationService;

    public CreateGoalUseCase(
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

    public GoalResponse execute(UUID userId, CreateGoalRequest request) {
        UUID goalUserId = null;
        UUID goalCoupleId = null;

        if (Boolean.TRUE.equals(request.isShared())) {
            Couple couple = coupleRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new BusinessException("NO_ACTIVE_COUPLE", "No active couple link found to create couple goal"));
            goalCoupleId = couple.id();
        } else {
            goalUserId = userId;
        }

        UUID goalId = UUID.randomUUID();

        Goal goal = new Goal(
            goalId,
            goalUserId,
            goalCoupleId,
            request.name(),
            request.description(),
            request.targetAmount(),
            BigDecimal.ZERO,
            request.deadline(),
            GoalStatus.ACTIVE,
            Instant.now(),
            Instant.now()
        );

        Goal saved = goalRepository.save(goal);

        if (request.initialAmount() != null && request.initialAmount().compareTo(BigDecimal.ZERO) > 0) {
            GoalContribution contribution = new GoalContribution(
                UUID.randomUUID(),
                goalId,
                userId,
                request.initialAmount(),
                "Valor inicial",
                request.deadline().isBefore(java.time.LocalDate.now()) ? request.deadline() : java.time.LocalDate.now(),
                Instant.now()
            );
            contributionRepository.save(contribution);
            recalculationService.recalculate(goalId);
            saved = goalRepository.findById(goalId).orElse(saved);
        }

        return mapToResponse(saved);
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
