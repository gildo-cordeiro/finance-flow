package com.financeflow.auth.service;

import com.financeflow.auth.dto.LoginRequest;
import com.financeflow.auth.dto.TokenResponse;
import com.financeflow.auth.model.RefreshTokenEntity;
import com.financeflow.auth.model.UserEntity;
import com.financeflow.auth.repository.RefreshTokenRepository;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.UnauthorizedException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LoginUseCase {

    private static final Logger log = LoggerFactory.getLogger(LoginUseCase.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository tokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginUseCase(
        UserRepository userRepository,
        RefreshTokenRepository tokenRepository,
        JwtService jwtService,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public TokenResponse execute(LoginRequest request) {
        log.info("User login attempt with email={}", request.email());

        UserEntity user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        log.info("User authenticated. Generating tokens for id={}", user.getId());

        String accessToken = jwtService.generateAccessToken(user.getId().toString());
        String refreshTokenString = UUID.randomUUID().toString();

        RefreshTokenEntity refreshToken = new RefreshTokenEntity(
            refreshTokenString,
            user.getId(),
            Instant.now().plus(Duration.ofDays(30))
        );

        tokenRepository.save(refreshToken);

        return new TokenResponse(accessToken, refreshTokenString);
    }
}
