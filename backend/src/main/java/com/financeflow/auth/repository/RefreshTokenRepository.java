package com.financeflow.auth.repository;

import com.financeflow.auth.model.RefreshTokenEntity;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {
    Optional<RefreshTokenEntity> findByToken(String token);
    RefreshTokenEntity save(RefreshTokenEntity token);
    void revokeAllByUserId(UUID userId);
}
