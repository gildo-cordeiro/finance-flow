package com.financeflow.goals.repository.jpa;

import com.financeflow.goals.model.entity.GoalEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringGoalRepository extends JpaRepository<GoalEntity, UUID> {
    List<GoalEntity> findAllByUserId(UUID userId);
    List<GoalEntity> findAllByCoupleId(UUID coupleId);

    @Query("SELECT g FROM GoalEntity g WHERE g.userId = :userId OR g.coupleId = :coupleId")
    List<GoalEntity> findAllByUserIdOrCoupleId(@Param("userId") UUID userId, @Param("coupleId") UUID coupleId);
}
