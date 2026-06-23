package com.financeflow.auth.service;

import com.financeflow.auth.dto.LoginRequest;
import com.financeflow.auth.dto.TokenResponse;
import com.financeflow.auth.model.domain.User;
import com.financeflow.auth.model.entity.RefreshTokenEntity;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.model.mapper.UserMapper;
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

        UserEntity entity = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        User user = UserMapper.toDomain(entity);

        if (!passwordEncoder.matches(request.password(), user.password())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        log.info("User authenticated. Generating tokens for id={}", user.id());

        String accessToken = jwtService.generateAccessToken(user.id().toString());
        String refreshTokenString = UUID.randomUUID().toString();

        RefreshTokenEntity refreshToken = new RefreshTokenEntity(
            refreshTokenString,
            user.id(),
            Instant.now().plus(Duration.ofDays(30))
        );

        tokenRepository.save(refreshToken);

        return new TokenResponse(accessToken, refreshTokenString);
    }
}
