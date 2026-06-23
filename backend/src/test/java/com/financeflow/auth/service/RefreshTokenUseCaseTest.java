package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.auth.dto.TokenResponse;
import com.financeflow.auth.model.entity.RefreshTokenEntity;
import com.financeflow.auth.repository.RefreshTokenRepository;
import com.financeflow.shared.exception.UnauthorizedException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RefreshTokenUseCaseTest {

    private RefreshTokenRepository tokenRepository;
    private JwtService jwtService;
    private RefreshTokenUseCase refreshTokenUseCase;

    @BeforeEach
    void setUp() {
        tokenRepository = mock(RefreshTokenRepository.class);
        jwtService = mock(JwtService.class);
        refreshTokenUseCase = new RefreshTokenUseCase(tokenRepository, jwtService);
    }

    @Test
    void shouldRotateTokensSuccessfullyWhenRefreshTokenIsValid() {
        String tokenString = "valid-refresh-token";
        UUID userId = UUID.randomUUID();
        RefreshTokenEntity oldToken = new RefreshTokenEntity(
            tokenString, userId, Instant.now().plusSeconds(1000)
        );

        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(oldToken));
        when(jwtService.generateAccessToken(userId.toString())).thenReturn("new-access-token");
        when(tokenRepository.save(any(RefreshTokenEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TokenResponse response = refreshTokenUseCase.execute(tokenString);

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isNotEqualTo(tokenString);
        assertThat(oldToken.isRevoked()).isTrue();
        verify(tokenRepository, times(2)).save(any(RefreshTokenEntity.class)); // 1 for oldToken revocation, 1 for newToken save
    }

    @Test
    void shouldThrowUnauthorizedExceptionAndRevokeAllTokensWhenTokenIsRevoked() {
        String tokenString = "revoked-refresh-token";
        UUID userId = UUID.randomUUID();
        RefreshTokenEntity oldToken = new RefreshTokenEntity(
            tokenString, userId, Instant.now().plusSeconds(1000)
        );
        oldToken.revoke(); // Simulate already revoked token

        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(oldToken));

        assertThatThrownBy(() -> refreshTokenUseCase.execute(tokenString))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("All sessions revoked");

        verify(tokenRepository, times(1)).revokeAllByUserId(userId);
    }

    @Test
    void shouldThrowUnauthorizedExceptionAndRevokeAllTokensWhenTokenIsExpired() {
        String tokenString = "expired-refresh-token";
        UUID userId = UUID.randomUUID();
        RefreshTokenEntity oldToken = new RefreshTokenEntity(
            tokenString, userId, Instant.now().minusSeconds(1000)
        );

        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(oldToken));

        assertThatThrownBy(() -> refreshTokenUseCase.execute(tokenString))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("All sessions revoked");

        verify(tokenRepository, times(1)).revokeAllByUserId(userId);
    }
}
