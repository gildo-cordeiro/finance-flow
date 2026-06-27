package com.financeflow.couple.repository;

import com.financeflow.couple.model.domain.Couple;
import java.util.Optional;
import java.util.UUID;

public interface CoupleRepository {
    Optional<Couple> findById(UUID id);
    Optional<Couple> findActiveOrPendingByUserId(UUID userId);
    Optional<Couple> findActiveByUserId(UUID userId);
    Optional<Couple> findByInviteToken(String token);
    Couple save(Couple couple);
}
