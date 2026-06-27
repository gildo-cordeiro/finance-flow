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

class DissolveCoupleUseCaseTest {

    private CoupleRepository coupleRepository;
    private DissolveCoupleUseCase dissolveCoupleUseCase;

    @BeforeEach
    void setUp() {
        coupleRepository = mock(CoupleRepository.class);
        dissolveCoupleUseCase = new DissolveCoupleUseCase(coupleRepository);
    }

    @Test
    void shouldThrowBusinessExceptionWhenNoActiveCoupleLinkExists() {
        UUID userId = UUID.randomUUID();
        when(coupleRepository.findActiveByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dissolveCoupleUseCase.execute(userId))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("code", "NO_ACTIVE_COUPLE");
    }

    @Test
    void shouldDissolveCoupleSuccessfullyWhenActiveCoupleLinkExists() {
        UUID userId = UUID.randomUUID();
        Couple couple = new Couple(
            UUID.randomUUID(), userId, UUID.randomUUID(), CoupleStatus.ACTIVE, null, null, Instant.now(), Instant.now()
        );
        when(coupleRepository.findActiveByUserId(userId)).thenReturn(Optional.of(couple));

        dissolveCoupleUseCase.execute(userId);

        verify(coupleRepository).save(any(Couple.class));
    }
}
