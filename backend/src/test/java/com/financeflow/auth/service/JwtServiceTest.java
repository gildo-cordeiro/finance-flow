package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // Set a long secret key (at least 256 bits for HMAC-SHA256) and a 5-second expiration
        jwtService = new JwtService(
            "financeflow-test-secret-key-that-is-very-long-and-secure-for-development",
            5000 // 5 seconds
        );
    }

    @Test
    void shouldGenerateValidToken() {
        String userId = UUID.randomUUID().toString();
        String token = jwtService.generateAccessToken(userId);

        assertThat(token).isNotBlank();
        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        assertThat(jwtService.isTokenValid("invalid.token.signature")).isFalse();
    }

    @Test
    void shouldReturnFalseForExpiredToken() throws InterruptedException {
        // Create a service with 1ms expiration
        JwtService shortLivedService = new JwtService(
            "financeflow-test-secret-key-that-is-very-long-and-secure-for-development",
            1
        );

        String userId = UUID.randomUUID().toString();
        String token = shortLivedService.generateAccessToken(userId);

        // Sleep to ensure it expires
        Thread.sleep(10);

        assertThat(shortLivedService.isTokenValid(token)).isFalse();
    }
}
