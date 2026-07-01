package com.financeflow.goals.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.dto.GoalResponse;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.repository.GoalRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ListGoalsUseCase {

    private final GoalRepository goalRepository;
    private final CoupleRepository coupleRepository;

    public ListGoalsUseCase(GoalRepository goalRepository, CoupleRepository coupleRepository) {
        this.goalRepository = goalRepository;
        this.coupleRepository = coupleRepository;
    }

    public List<GoalResponse> execute(UUID userId, String viewContext) {
        Couple couple = coupleRepository.findActiveByUserId(userId).orElse(null);
        List<Goal> goals;

        if (couple != null && "COUPLE".equalsIgnoreCase(viewContext)) {
            goals = goalRepository.findAllByCoupleId(couple.id());
        } else {
            goals = goalRepository.findAllByUserId(userId);
        }

        return goals.stream()
            .map(this::mapToResponse)
            .toList();
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
