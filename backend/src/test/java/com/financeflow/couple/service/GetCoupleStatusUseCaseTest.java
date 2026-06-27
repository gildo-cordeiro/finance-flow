package com.financeflow.couple.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.couple.dto.CoupleResponse;
import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.domain.CoupleStatus;
import com.financeflow.couple.repository.CoupleRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetCoupleStatusUseCaseTest {

    private CoupleRepository coupleRepository;
    private UserRepository userRepository;
    private GetCoupleStatusUseCase getCoupleStatusUseCase;

    @BeforeEach
    void setUp() {
        coupleRepository = mock(CoupleRepository.class);
        userRepository = mock(UserRepository.class);
        getCoupleStatusUseCase = new GetCoupleStatusUseCase(coupleRepository, userRepository);
    }

    @Test
    void shouldReturnNoneStatusWhenNoCoupleExists() {
        UUID userId = UUID.randomUUID();
        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.empty());

        CoupleResponse response = getCoupleStatusUseCase.execute(userId);

        assertThat(response.status()).isEqualTo("NONE");
        assertThat(response.isSender()).isNull();
        assertThat(response.partnerEmail()).isNull();
        assertThat(response.partnerName()).isNull();
        assertThat(response.inviteToken()).isNull();
    }

    @Test
    void shouldReturnActiveStatusWhenActiveCoupleExists() {
        UUID userId = UUID.randomUUID();
        UUID partnerId = UUID.randomUUID();
        Couple couple = new Couple(
            UUID.randomUUID(), userId, partnerId, CoupleStatus.ACTIVE, null, null, Instant.now(), Instant.now()
        );
        UserEntity partner = new UserEntity(
            partnerId, "partner@test.com", "pass", "Partner Name", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );

        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.of(couple));
        when(userRepository.findById(partnerId)).thenReturn(Optional.of(partner));

        CoupleResponse response = getCoupleStatusUseCase.execute(userId);

        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.isSender()).isNull();
        assertThat(response.partnerEmail()).isEqualTo("partner@test.com");
        assertThat(response.partnerName()).isEqualTo("Partner Name");
        assertThat(response.inviteToken()).isNull();
    }

    @Test
    void shouldReturnPendingStatusWithIsSenderTrueWhenUserSentTheInvite() {
        UUID userId = UUID.randomUUID();
        UUID partnerId = UUID.randomUUID();
        Couple couple = new Couple(
            UUID.randomUUID(), userId, partnerId, CoupleStatus.PENDING, "tok", Instant.now(), Instant.now(), Instant.now()
        );
        UserEntity partner = new UserEntity(
            partnerId, "partner@test.com", "pass", "Partner Name", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );

        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.of(couple));
        when(userRepository.findById(partnerId)).thenReturn(Optional.of(partner));

        CoupleResponse response = getCoupleStatusUseCase.execute(userId);

        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.isSender()).isTrue();
        assertThat(response.partnerEmail()).isEqualTo("partner@test.com");
        assertThat(response.partnerName()).isEqualTo("Partner Name");
        assertThat(response.inviteToken()).isEqualTo("tok");
    }

    @Test
    void shouldReturnPendingStatusWithIsSenderFalseWhenUserReceivedTheInvite() {
        UUID userId = UUID.randomUUID();
        UUID partnerId = UUID.randomUUID();
        Couple couple = new Couple(
            UUID.randomUUID(), partnerId, userId, CoupleStatus.PENDING, "tok", Instant.now(), Instant.now(), Instant.now()
        );
        UserEntity partner = new UserEntity(
            partnerId, "partner@test.com", "pass", "Partner Name", "UTC", "BRL", 5, Instant.now(), Instant.now()
        );

        when(coupleRepository.findActiveOrPendingByUserId(userId)).thenReturn(Optional.of(couple));
        when(userRepository.findById(partnerId)).thenReturn(Optional.of(partner));

        CoupleResponse response = getCoupleStatusUseCase.execute(userId);

        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.isSender()).isFalse();
        assertThat(response.partnerEmail()).isEqualTo("partner@test.com");
        assertThat(response.partnerName()).isEqualTo("Partner Name");
        assertThat(response.inviteToken()).isEqualTo("tok");
    }
}
