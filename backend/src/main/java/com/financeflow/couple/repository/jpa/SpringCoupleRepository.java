package com.financeflow.couple.repository.jpa;

import com.financeflow.couple.model.entity.CoupleEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringCoupleRepository extends JpaRepository<CoupleEntity, UUID> {

    @Query("SELECT c FROM CoupleEntity c WHERE (c.user1Id = :userId OR c.user2Id = :userId) AND (c.status = 'ACTIVE' OR c.status = 'PENDING')")
    Optional<CoupleEntity> findActiveOrPendingByUserId(@Param("userId") UUID userId);

    @Query("SELECT c FROM CoupleEntity c WHERE (c.user1Id = :userId OR c.user2Id = :userId) AND c.status = 'ACTIVE'")
    Optional<CoupleEntity> findActiveByUserId(@Param("userId") UUID userId);

    Optional<CoupleEntity> findByInviteToken(String inviteToken);
}
