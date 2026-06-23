package com.financeflow.auth.repository;

import com.financeflow.auth.model.RefreshTokenEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaRefreshTokenRepository implements RefreshTokenRepository {

    private final SpringRefreshTokenRepository springRepo;

    public JpaRefreshTokenRepository(SpringRefreshTokenRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Optional<RefreshTokenEntity> findByToken(String token) {
        return springRepo.findByToken(token);
    }

    @Override
    public RefreshTokenEntity save(RefreshTokenEntity token) {
        return springRepo.save(token);
    }

    @Override
    public void revokeAllByUserId(UUID userId) {
        springRepo.revokeAllByUserId(userId);
    }
}
