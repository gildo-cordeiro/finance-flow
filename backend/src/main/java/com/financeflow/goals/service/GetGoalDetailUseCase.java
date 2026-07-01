package com.financeflow.goals.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.dto.GoalContributionResponse;
import com.financeflow.goals.dto.GoalDetailResponse;
import com.financeflow.goals.dto.GoalResponse;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.domain.GoalStatus;
import com.financeflow.goals.repository.GoalContributionRepository;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.shared.exception.ForbiddenException;
import com.financeflow.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GetGoalDetailUseCase {

    private final GoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;
    private final CoupleRepository coupleRepository;

    public GetGoalDetailUseCase(
        GoalRepository goalRepository,
        GoalContributionRepository contributionRepository,
        CoupleRepository coupleRepository
    ) {
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
        this.coupleRepository = coupleRepository;
    }

    public GoalDetailResponse execute(UUID userId, UUID goalId) {
        Goal goal = goalRepository.findById(goalId)
            .orElseThrow(() -> new NotFoundException("Goal", goalId));

        validateOwnership(userId, goal);

        // Fetch manual contributions
        List<GoalContributionResponse> manual = contributionRepository.findAllByGoalId(goalId).stream()
            .map(c -> new GoalContributionResponse(
                c.id(),
                c.goalId(),
                c.userId(),
                c.amount(),
                c.note(),
                c.contributionDate(),
                "MANUAL",
                c.createdAt()
            ))
            .toList();

        // Merge and sort by contribution date desc, then created date desc
        List<GoalContributionResponse> contributions = new ArrayList<>(manual);
        contributions.sort(
            Comparator.comparing(GoalContributionResponse::contributionDate)
                .thenComparing(GoalContributionResponse::createdAt)
                .reversed()
        );

        // Calculate projection
        LocalDate projectedCompletionDate = calculateProjectedCompletionDate(goal, contributions);

        GoalResponse goalResponse = new GoalResponse(
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

        return new GoalDetailResponse(goalResponse, contributions, projectedCompletionDate);
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

    public LocalDate calculateProjectedCompletionDate(Goal goal, List<GoalContributionResponse> contributions) {
        if (goal.status() == GoalStatus.ARCHIVED) {
            return null;
        }

        BigDecimal target = goal.targetAmount();
        BigDecimal current = goal.currentAmount();

        if (current.compareTo(target) >= 0) {
            // Already completed: return the date of the most recent contribution or today if none
            return contributions.isEmpty() ? LocalDate.now() : contributions.get(0).contributionDate();
        }

        if (contributions.isEmpty()) {
            return null;
        }

        LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);
        List<GoalContributionResponse> last3Months = contributions.stream()
            .filter(c -> !c.contributionDate().isBefore(threeMonthsAgo))
            .toList();

        BigDecimal monthlyRate;
        if (!last3Months.isEmpty()) {
            BigDecimal sum = last3Months.stream()
                .map(GoalContributionResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            monthlyRate = sum.divide(BigDecimal.valueOf(3), 4, RoundingMode.HALF_UP);
        } else {
            // Use the most recent contribution
            monthlyRate = contributions.get(0).amount();
        }

        if (monthlyRate.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        BigDecimal remaining = target.subtract(current);
        BigDecimal monthsNeeded = remaining.divide(monthlyRate, 4, RoundingMode.HALF_UP);
        BigDecimal daysNeededDec = monthsNeeded.multiply(BigDecimal.valueOf(30));
        long daysNeeded = daysNeededDec.setScale(0, RoundingMode.CEILING).longValue();

        return LocalDate.now().plusDays(daysNeeded);
    }
}
