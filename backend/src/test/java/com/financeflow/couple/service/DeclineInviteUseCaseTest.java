package com.financeflow.couple.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.shared.exception.BusinessException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DeclineInviteUseCaseTest {

    private CoupleRepository coupleRepository;
    private DeclineInviteUseCase declineInviteUseCase;

    @BeforeEach
    void setUp() {
        coupleRepository = mock(CoupleRepository.class);
        declineInviteUseCase = new DeclineInviteUseCase(coupleRepository);
    }

    @Test
    void shouldThrowBusinessExceptionWhenNoPendingInviteExists() {
        UUID userId = UUID.randomUUID();
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> declineInviteUseCase.execute(userId))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "NO_PENDING_INVITE");
    }

    @Test
    void shouldThrowBusinessExceptionWhenInviteIsActiveNotPending() {
        UUID userId = UUID.randomUUID();
        Couple couple = new Couple(
            UUID.randomUUID(), userId, UUID.randomUUID(), CoupleStatus.ACTIVE, null, null, Instant.now(), Instant.now()
        );
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.of(couple));

        assertThatThrownBy(() -> declineInviteUseCase.execute(userId))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "NO_PENDING_INVITE");
    }

    @Test
    void shouldDeclineInviteSuccessfullyWhenInviteIsPending() {
        UUID userId = UUID.randomUUID();
        Couple couple = new Couple(
            UUID.randomUUID(), userId, UUID.randomUUID(), CoupleStatus.PENDING, "tok", Instant.now(), Instant.now(), Instant.now()
        );
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.of(couple));

        declineInviteUseCase.execute(userId);

        verify(coupleRepository).save(any(Couple.class));
    }
}
