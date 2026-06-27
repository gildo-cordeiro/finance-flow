package com.financeflow.couple.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.couple.dto.InvitePartnerRequest;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InvitePartnerUseCaseTest {

    private CoupleRepository coupleRepository;
    private UserRepository userRepository;
    private InvitePartnerUseCase invitePartnerUseCase;

    @BeforeEach
    void setUp() {
        coupleRepository = mock(CoupleRepository.class);
        userRepository = mock(UserRepository.class);
        invitePartnerUseCase = new InvitePartnerUseCase(coupleRepository, userRepository);
    }

    @Test
    void shouldThrowNotFoundExceptionWhenPartnerEmailDoesNotExist() {
        UUID userId = UUID.randomUUID();
        InvitePartnerRequest request = new InvitePartnerRequest("nonexistent@test.com");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invitePartnerUseCase.execute(userId, request))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("nonexistent@test.com");
    }

    @Test
    void shouldThrowBusinessExceptionWhenInvitingSelf() {
        UUID userId = UUID.randomUUID();
        InvitePartnerRequest request = new InvitePartnerRequest("self@test.com");
        UserEntity partner = new UserEntity(
            userId, "self@test.com", "pass", "Self", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(partner));

        assertThatThrownBy(() -> invitePartnerUseCase.execute(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "SELF_INVITE");
    }

    @Test
    void shouldThrowBusinessExceptionWhenUserAlreadyHasActiveOrPendingCouple() {
        UUID userId = UUID.randomUUID();
        UUID partnerId = UUID.randomUUID();
        InvitePartnerRequest request = new InvitePartnerRequest("partner@test.com");
        UserEntity partner = new UserEntity(
            partnerId, "partner@test.com", "pass", "Partner", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );
        Couple existingCouple = new Couple(
            UUID.randomUUID(), userId, UUID.randomUUID(), CoupleStatus.PENDING, "tok", Instant.now(), Instant.now(), Instant.now()
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(partner));
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.of(existingCouple));

        assertThatThrownBy(() -> invitePartnerUseCase.execute(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "ALREADY_LINKED");
    }

    @Test
    void shouldThrowBusinessExceptionWhenPartnerAlreadyHasActiveOrPendingCouple() {
        UUID userId = UUID.randomUUID();
        UUID partnerId = UUID.randomUUID();
        InvitePartnerRequest request = new InvitePartnerRequest("partner@test.com");
        UserEntity partner = new UserEntity(
            partnerId, "partner@test.com", "pass", "Partner", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );
        Couple partnerCouple = new Couple(
            UUID.randomUUID(), partnerId, UUID.randomUUID(), CoupleStatus.ACTIVE, null, null, Instant.now(), Instant.now()
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(partner));
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.empty());
        when(coupleRepository.findActiveOrPendingByUserId(partnerId)).thenReturn(Optional.of(partnerCouple));

        assertThatThrownBy(() -> invitePartnerUseCase.execute(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "PARTNER_ALREADY_LINKED");
    }

    @Test
    void shouldCreateInviteSuccessfullyWhenRequestIsValid() {
        UUID userId = UUID.randomUUID();
        UUID partnerId = UUID.randomUUID();
        InvitePartnerRequest request = new InvitePartnerRequest("partner@test.com");
        UserEntity partner = new UserEntity(
            partnerId, "partner@test.com", "pass", "Partner", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(partner));
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.empty());
        when(coupleRepository.findActiveOrPendingByUserId(partnerId)).thenReturn(Optional.empty());

        invitePartnerUseCase.execute(userId, request);

        verify(coupleRepository).save(any(Couple.class));
    }
}
