package com.financeflow.goals.repository;

import com.financeflow.goals.model.domain.Goal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalRepository {
    Optional<Goal> findById(UUID id);
    List<Goal> findAllByUserId(UUID userId);
    List<Goal> findAllByCoupleId(UUID coupleId);
    List<Goal> findAllByUserIdOrCoupleId(UUID userId, UUID coupleId);
    Goal save(Goal goal);
}
