package com.financeflow.couple.service;

import com.financeflow.couple.dto.AcceptInviteRequest;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcceptInviteUseCase {

    private final CoupleRepository coupleRepository;

    public AcceptInviteUseCase(CoupleRepository coupleRepository) {
        this.coupleRepository = coupleRepository;
    }

    @Transactional
    public void execute(UUID userId, AcceptInviteRequest request) {
        Couple couple = coupleRepository.findByInviteToken(request.token())
            .orElseThrow(() -> new BusinessException("INVALID_TOKEN", "Invite token not found"));

        if (couple.status() != CoupleStatus.PENDING) {
            throw new BusinessException("INVALID_STATUS", "This invite is no longer pending");
        }

        if (couple.inviteExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("TOKEN_EXPIRED", "This invite token has expired");
        }

        if (!couple.user2Id().equals(userId)) {
            throw new ForbiddenException("Only the invited user can accept this invite");
        }

        Couple updatedCouple = new Couple(
            couple.id(),
            couple.user1Id(),
            couple.user2Id(),
            CoupleStatus.ACTIVE,
            null,
            null,
            couple.createdAt(),
            Instant.now()
        );

        coupleRepository.save(updatedCouple);
    }
}
