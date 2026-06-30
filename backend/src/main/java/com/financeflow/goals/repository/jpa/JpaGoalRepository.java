package com.financeflow.goals.repository.jpa;

import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.entity.GoalEntity;
import com.financeflow.goals.model.mapper.GoalMapper;
import com.financeflow.goals.repository.GoalRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaGoalRepository implements GoalRepository {

    private final SpringGoalRepository springGoalRepository;

    public JpaGoalRepository(SpringGoalRepository springGoalRepository) {
        this.springGoalRepository = springGoalRepository;
    }

    @Override
    public Optional<Goal> findById(UUID id) {
        return springGoalRepository.findById(id).map(GoalMapper::toDomain);
    }

    @Override
    public List<Goal> findAllByUserId(UUID userId) {
        return springGoalRepository.findAllByUserId(userId).stream()
            .map(GoalMapper::toDomain)
            .toList();
    }

    @Override
    public List<Goal> findAllByCoupleId(UUID coupleId) {
        return springGoalRepository.findAllByCoupleId(coupleId).stream()
            .map(GoalMapper::toDomain)
            .toList();
    }

    @Override
    public List<Goal> findAllByUserIdOrCoupleId(UUID userId, UUID coupleId) {
        return springGoalRepository.findAllByUserIdOrCoupleId(userId, coupleId).stream()
            .map(GoalMapper::toDomain)
            .toList();
    }

    @Override
    public Goal save(Goal goal) {
        GoalEntity entity = GoalMapper.toEntity(goal);
        GoalEntity saved = springGoalRepository.save(entity);
        return GoalMapper.toDomain(saved);
    }
}
