package com.financeflow.couple.service;

import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.couple.dto.CoupleResponse;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetCoupleStatusUseCase {

    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;

    public GetCoupleStatusUseCase(CoupleRepository coupleRepository, UserRepository userRepository) {
        this.coupleRepository = coupleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CoupleResponse execute(UUID userId) {
        Optional<Couple> coupleOpt = coupleRepository.findActiveOrPendingByUserId(userId);

        if (coupleOpt.isEmpty()) {
            return new CoupleResponse("NONE", null, null, null, null);
        }

        Couple couple = coupleOpt.get();

        if (couple.status() == CoupleStatus.ACTIVE) {
            UUID partnerId = couple.user1Id().equals(userId) ? couple.user2Id() : couple.user1Id();
            UserEntity partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new NotFoundException("Partner user", partnerId));

            return new CoupleResponse(
                "ACTIVE",
                null,
                partner.getEmail(),
                partner.getName(),
                null
            );
        } else {
            // PENDING
            boolean isSender = couple.user1Id().equals(userId);
            UUID partnerId = isSender ? couple.user2Id() : couple.user1Id();
            UserEntity partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new NotFoundException("Partner user", partnerId));

            return new CoupleResponse(
                "PENDING",
                isSender,
                partner.getEmail(),
                partner.getName(),
                couple.inviteToken()
            );
        }
    }
}
