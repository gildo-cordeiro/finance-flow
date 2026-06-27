package com.financeflow.couple.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.couple.dto.AcceptInviteRequest;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import com.financeflow.shared.exception.ForbiddenException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AcceptInviteUseCaseTest {

    private CoupleRepository coupleRepository;
    private AcceptInviteUseCase acceptInviteUseCase;

    @BeforeEach
    void setUp() {
        coupleRepository = mock(CoupleRepository.class);
        acceptInviteUseCase = new AcceptInviteUseCase(coupleRepository);
    }

    @Test
    void shouldThrowBusinessExceptionWhenTokenDoesNotExist() {
        UUID userId = UUID.randomUUID();
        AcceptInviteRequest request = new AcceptInviteRequest("invalid-token");
        when(coupleRepository.findByInviteToken("invalid-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> acceptInviteUseCase.execute(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "INVALID_TOKEN");
    }

    @Test
    void shouldThrowBusinessExceptionWhenInviteIsNotPending() {
        UUID userId = UUID.randomUUID();
        AcceptInviteRequest request = new AcceptInviteRequest("token");
        Couple couple = new Couple(
            UUID.randomUUID(), UUID.randomUUID(), userId, CoupleStatus.ACTIVE, "token", Instant.now().plus(1, ChronoUnit.DAYS), Instant.now(), Instant.now()
        );
        when(coupleRepository.findByInviteToken("token")).thenReturn(Optional.of(couple));

        assertThatThrownBy(() -> acceptInviteUseCase.execute(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "INVALID_STATUS");
    }

    @Test
    void shouldThrowBusinessExceptionWhenTokenHasExpired() {
        UUID userId = UUID.randomUUID();
        AcceptInviteRequest request = new AcceptInviteRequest("token");
        Couple couple = new Couple(
            UUID.randomUUID(), UUID.randomUUID(), userId, CoupleStatus.PENDING, "token", Instant.now().minus(1, ChronoUnit.MINUTES), Instant.now(), Instant.now()
        );
        when(coupleRepository.findByInviteToken("token")).thenReturn(Optional.of(couple));

        assertThatThrownBy(() -> acceptInviteUseCase.execute(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "TOKEN_EXPIRED");
    }

    @Test
    void shouldThrowForbiddenExceptionWhenUserIsNotTheInvitedOne() {
        UUID userId = UUID.randomUUID();
        AcceptInviteRequest request = new AcceptInviteRequest("token");
        Couple couple = new Couple(
            UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), CoupleStatus.PENDING, "token", Instant.now().plus(1, ChronoUnit.DAYS), Instant.now(), Instant.now()
        );
        when(coupleRepository.findByInviteToken("token")).thenReturn(Optional.of(couple));

        assertThatThrownBy(() -> acceptInviteUseCase.execute(userId, request))
            .isInstanceOf(ForbiddenException.class)
            .hasMessageContaining("Only the invited user can accept this invite");
    }

    @Test
    void shouldAcceptInviteSuccessfullyWhenRequestIsValid() {
        UUID userId = UUID.randomUUID();
        AcceptInviteRequest request = new AcceptInviteRequest("token");
        Couple couple = new Couple(
            UUID.randomUUID(), UUID.randomUUID(), userId, CoupleStatus.PENDING, "token", Instant.now().plus(1, ChronoUnit.DAYS), Instant.now(), Instant.now()
        );
        when(coupleRepository.findByInviteToken("token")).thenReturn(Optional.of(couple));

        acceptInviteUseCase.execute(userId, request);

        verify(coupleRepository).save(any(Couple.class));
    }
}
