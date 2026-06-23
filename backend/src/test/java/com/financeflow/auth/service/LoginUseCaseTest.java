package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.auth.dto.LoginRequest;
import com.financeflow.auth.dto.TokenResponse;
import com.financeflow.auth.model.entity.RefreshTokenEntity;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.RefreshTokenRepository;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.UnauthorizedException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class LoginUseCaseTest {

    private UserRepository userRepository;
    private RefreshTokenRepository tokenRepository;
    private JwtService jwtService;
    private PasswordEncoder passwordEncoder;
    private LoginUseCase loginUseCase;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        tokenRepository = mock(RefreshTokenRepository.class);
        jwtService = mock(JwtService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        loginUseCase = new LoginUseCase(userRepository, tokenRepository, jwtService, passwordEncoder);
    }

    @Test
    void shouldAuthenticateUserSuccessfullyWhenCredentialsAreValid() {
        LoginRequest request = new LoginRequest("test@test.com", "password123");
        UserEntity user = new UserEntity(
            UUID.randomUUID(),
            "test@test.com",
            "encoded-password",
            "John",
            "TZ",
            "BRL",
            5,
            Instant.now(),
            Instant.now()
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(true);
        when(jwtService.generateAccessToken(user.getId().toString())).thenReturn("access-token");
        when(tokenRepository.save(any(RefreshTokenEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TokenResponse response = loginUseCase.execute(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotNull();
        verify(tokenRepository, times(1)).save(any(RefreshTokenEntity.class));
    }

    @Test
    void shouldThrowUnauthorizedExceptionWhenLoginEmailDoesNotExist() {
        LoginRequest request = new LoginRequest("notfound@test.com", "password123");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loginUseCase.execute(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid email or password");
    }

    @Test
    void shouldThrowUnauthorizedExceptionWhenLoginPasswordIsIncorrect() {
        LoginRequest request = new LoginRequest("test@test.com", "wrongpassword");
        UserEntity user = new UserEntity(
            UUID.randomUUID(),
            "test@test.com",
            "encoded-password",
            "John",
            "TZ",
            "BRL",
            5,
            Instant.now(),
            Instant.now()
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> loginUseCase.execute(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid email or password");
    }
}
