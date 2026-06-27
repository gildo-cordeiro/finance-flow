package com.financeflow.couple.service;

import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.couple.dto.InvitePartnerRequest;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitePartnerUseCase {

    private static final Logger log = LoggerFactory.getLogger(InvitePartnerUseCase.class);

    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;

    public InvitePartnerUseCase(CoupleRepository coupleRepository, UserRepository userRepository) {
        this.coupleRepository = coupleRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void execute(UUID userId, InvitePartnerRequest request) {
        UserEntity partner = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new NotFoundException("User", request.email()));

        if (userId.equals(partner.getId())) {
            throw new BusinessException("SELF_INVITE", "Cannot invite yourself");
        }

        coupleRepository.findActiveOrPendingByUserId(userId)
            .ifPresent(c -> {
                throw new BusinessException("ALREADY_LINKED", "You already have an active or pending couple link");
            });

        coupleRepository.findActiveOrPendingByUserId(partner.getId())
            .ifPresent(c -> {
                throw new BusinessException("PARTNER_ALREADY_LINKED", "The partner you invited already has an active or pending couple link");
            });

        String inviteToken = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(48, ChronoUnit.HOURS);

        Couple couple = new Couple(
            null,
            userId,
            partner.getId(),
            CoupleStatus.PENDING,
            inviteToken,
            expiresAt,
            Instant.now(),
            Instant.now()
        );

        coupleRepository.save(couple);

        log.info("Invite sent to {} successfully! Token: {}", request.email(), inviteToken);
        log.info("Link: http://localhost:5173/couple/accept?token={}", inviteToken);
    }
}
