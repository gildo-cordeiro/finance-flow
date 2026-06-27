package com.financeflow.couple.repository.jpa;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.entity.CoupleEntity;
import com.financeflow.couple.model.mapper.CoupleMapper;
import com.financeflow.couple.repository.CoupleRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaCoupleRepository implements CoupleRepository {

    private final SpringCoupleRepository springCoupleRepository;

    public JpaCoupleRepository(SpringCoupleRepository springCoupleRepository) {
        this.springCoupleRepository = springCoupleRepository;
    }

    @Override
    public Optional<Couple> findById(UUID id) {
        return springCoupleRepository.findById(id)
            .map(CoupleMapper::toDomain);
    }

    @Override
    public Optional<Couple> findActiveOrPendingByUserId(UUID userId) {
        return springCoupleRepository.findActiveOrPendingByUserId(userId)
            .map(CoupleMapper::toDomain);
    }

    @Override
    public Optional<Couple> findActiveByUserId(UUID userId) {
        return springCoupleRepository.findActiveByUserId(userId)
            .map(CoupleMapper::toDomain);
    }

    @Override
    public Optional<Couple> findByInviteToken(String token) {
        return springCoupleRepository.findByInviteToken(token)
            .map(CoupleMapper::toDomain);
    }

    @Override
    public Couple save(Couple couple) {
        CoupleEntity entity = CoupleMapper.toEntity(couple);
        CoupleEntity saved = springCoupleRepository.save(entity);
        return CoupleMapper.toDomain(saved);
    }
}
