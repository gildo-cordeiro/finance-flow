package com.financeflow.goals.repository.jpa;

import com.financeflow.goals.model.domain.GoalContribution;
import com.financeflow.goals.model.entity.GoalContributionEntity;
import com.financeflow.goals.model.mapper.GoalContributionMapper;
import com.financeflow.goals.repository.GoalContributionRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaGoalContributionRepository implements GoalContributionRepository {

    private final SpringGoalContributionRepository springRepository;

    public JpaGoalContributionRepository(SpringGoalContributionRepository springRepository) {
        this.springRepository = springRepository;
    }

    @Override
    public Optional<GoalContribution> findById(UUID id) {
        return springRepository.findById(id).map(GoalContributionMapper::toDomain);
    }

    @Override
    public List<GoalContribution> findAllByGoalId(UUID goalId) {
        return springRepository.findAllByGoalId(goalId).stream()
            .map(GoalContributionMapper::toDomain)
            .toList();
    }

    @Override
    public GoalContribution save(GoalContribution contribution) {
        GoalContributionEntity entity = GoalContributionMapper.toEntity(contribution);
        GoalContributionEntity saved = springRepository.save(entity);
        return GoalContributionMapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        springRepository.deleteById(id);
    }
}
