package com.financeflow.couple.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DissolveCoupleUseCase {

    private final CoupleRepository coupleRepository;

    public DissolveCoupleUseCase(CoupleRepository coupleRepository) {
        this.coupleRepository = coupleRepository;
    }

    @Transactional
    public void execute(UUID userId) {
        Couple couple = coupleRepository.findActiveByUserId(userId)
            .orElseThrow(() -> new BusinessException("NO_ACTIVE_COUPLE", "No active couple link found"));

        Couple updatedCouple = new Couple(
            couple.id(),
            couple.user1Id(),
            couple.user2Id(),
            CoupleStatus.DISSOLVED,
            null,
            null,
            couple.createdAt(),
            Instant.now()
        );

        coupleRepository.save(updatedCouple);
    }
}
