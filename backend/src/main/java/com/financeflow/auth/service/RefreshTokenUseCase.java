package com.financeflow.auth.service;

import com.financeflow.auth.dto.TokenResponse;
import com.financeflow.auth.model.RefreshTokenEntity;
import com.financeflow.auth.repository.RefreshTokenRepository;
import com.financeflow.shared.exception.UnauthorizedException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RefreshTokenUseCase {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenUseCase.class);

    private final RefreshTokenRepository tokenRepository;
    private final JwtService jwtService;

    public RefreshTokenUseCase(RefreshTokenRepository tokenRepository, JwtService jwtService) {
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
    }

    public TokenResponse execute(String requestToken) {
        log.info("Refreshing token");

        RefreshTokenEntity oldToken = tokenRepository.findByToken(requestToken)
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (oldToken.isRevoked() || oldToken.isExpired()) {
            tokenRepository.revokeAllByUserId(oldToken.getUserId());
            log.warn("Revoked all refresh tokens for user={} due to reused or expired token", oldToken.getUserId());
            throw new UnauthorizedException("Token has been reused or expired. All sessions revoked.");
        }

        oldToken.revoke();
        tokenRepository.save(oldToken);

        String newAccessToken = jwtService.generateAccessToken(oldToken.getUserId().toString());
        String newRefreshTokenString = UUID.randomUUID().toString();

        RefreshTokenEntity newToken = new RefreshTokenEntity(
            newRefreshTokenString,
            oldToken.getUserId(),
            Instant.now().plus(Duration.ofDays(30))
        );

        tokenRepository.save(newToken);
        log.info("Tokens rotated successfully for user={}", oldToken.getUserId());

        return new TokenResponse(newAccessToken, newRefreshTokenString);
    }
}
